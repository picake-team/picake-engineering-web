/**
 * 휴대폰 알림 목록 (SC-71, 홈 위쪽 종). 지금 스토어의 주문 알림을 최신순으로, 날짜로 묶어 계속 불러온다.
 * 안 읽은 알림은 굵게 + 주황 점. 누르면 읽음이 되고 그 주문 상세로.
 */
import React, { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { AppScreen, BackHeader } from "@/apps/web-seller/common/ui/Screen";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { ChipGroup } from "@/apps/web-seller/common/ui/Choice";
import { EmptyState, LoadErrorState, SkeletonCards } from "@/apps/web-seller/common/ui/Surface";
import { PullToRefresh } from "@/apps/web-seller/common/ui/PullToRefresh";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { useQueryErrorAlert } from "@/apps/web-seller/common/hooks/useQueryErrorAlert";
import {
  addDaysToKey,
  formatKeyMonthDayWeek,
  kstDateKey,
  kstTime,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { notificationApi } from "@/apps/web-seller/features/notification/apis/notification.api";
import { notificationQueryKeys } from "@/apps/web-seller/features/notification/constants/notificationQueryKeys.constant";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/apps/web-seller/features/notification/hooks/mutations/useNotificationMutation";
import { useNotificationUnreadCount } from "@/apps/web-seller/features/notification/hooks/queries/useNotificationQuery";
import type {
  NotificationListResponseDto,
  SellerNotificationItem,
} from "@/apps/web-seller/features/notification/types/notification.dto";
import { LoadMoreSentinel } from "@/apps/web-seller/features/order/components/mobile/OrderCards";

const PAGE_SIZE = 30;

function dayLabel(key: string, todayKey: string): string {
  if (key === todayKey) return "오늘";
  if (key === addDaysToKey(todayKey, -1)) return "어제";
  return formatKeyMonthDayWeek(key);
}

export const StoreDetailNotificationsListMobilePage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const unreadOnly = params.get("filter") === "unread";

  const list = useInfiniteQuery<NotificationListResponseDto>({
    queryKey: [...notificationQueryKeys.list(storeId), "mobile", { unreadOnly }],
    queryFn: ({ pageParam }) =>
      notificationApi.getNotifications({
        storeId,
        page: pageParam as number,
        limit: PAGE_SIZE,
        unreadOnly,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNext ? last.meta.currentPage + 1 : undefined),
    enabled: !!storeId,
  });
  useQueryErrorAlert(list);
  const unread = useNotificationUnreadCount(storeId);
  const markRead = useMarkNotificationRead(storeId);
  const markAll = useMarkAllNotificationsRead(storeId);

  const todayKey = kstDateKey(new Date());
  const sections = useMemo(() => {
    const out: { key: string; items: SellerNotificationItem[] }[] = [];
    const seen = new Set<string>();
    for (const page of list.data?.pages ?? []) {
      for (const n of page.data) {
        if (seen.has(n.id)) continue;
        seen.add(n.id);
        const key = kstDateKey(n.createdAt);
        const last = out[out.length - 1];
        if (last && last.key === key) last.items.push(n);
        else out.push({ key, items: [n] });
      }
    }
    return out;
  }, [list.data]);

  const open = (n: SellerNotificationItem) => {
    if (!n.read) markRead.mutate(n.id);
    navigate(ROUTES.STORE_DETAIL_ORDERS_DETAIL(n.storeId, n.orderId));
  };

  const setFilter = (v: "all" | "unread") => {
    const p = new URLSearchParams(params);
    if (v === "unread") p.set("filter", "unread");
    else p.delete("filter");
    setParams(p, { replace: true });
  };

  const unreadCount = unread.data ?? 0;

  return (
    <AppScreen
      header={
        <BackHeader
          title="알림"
          onBack={() => navigate(ROUTES.STORE_DETAIL_HOME(storeId))}
          actions={
            <Button
              variant="quiet"
              disabled={unreadCount === 0 || markAll.isPending}
              onClick={() => markAll.mutate()}
              className="mr-1 font-bold"
            >
              모두 읽음
            </Button>
          }
        />
      }
    >
      <PullToRefresh
        onRefresh={() => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })}
      >
        <ChipGroup
          label="알림 거르기"
          value={unreadOnly ? "unread" : "all"}
          onChange={setFilter}
          options={[
            { value: "all", label: "전체" },
            { value: "unread", label: "안 읽음", count: unreadCount || undefined },
          ]}
        />
        {list.isLoading ? (
          <SkeletonCards thumb={false} />
        ) : list.isError ? (
          <LoadErrorState big onRetry={() => void list.refetch()} />
        ) : sections.length === 0 ? (
          <EmptyState
            big
            icon="bell"
            title={unreadOnly ? "읽지 않은 알림이 없어요" : "알림이 없어요"}
          />
        ) : (
          sections.map((s) => (
            <section key={s.key} aria-label={dayLabel(s.key, todayKey)} className="flex flex-col">
              <h2 className="mt-1 text-sub font-bold text-ink-700">{dayLabel(s.key, todayKey)}</h2>
              {s.items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => open(n)}
                  className="flex gap-3 border-b border-ink-100 py-4 text-left active:bg-ink-50"
                >
                  <span
                    aria-hidden="true"
                    className={cx("mt-2 size-2 shrink-0 rounded-full", n.read ? "" : "bg-brand")}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span
                      className={cx("text-body text-ink-900", n.read ? "font-normal" : "font-bold")}
                    >
                      {n.read ? null : <span className="sr-only">안 읽음, </span>}
                      {n.title}
                    </span>
                    <span className="text-sub text-ink-600">{n.body}</span>
                    <span className="text-caption text-ink-600">{kstTime(n.createdAt)}</span>
                  </span>
                </button>
              ))}
            </section>
          ))
        )}
        <LoadMoreSentinel
          hasNext={Boolean(list.hasNextPage)}
          loading={list.isFetchingNextPage}
          onLoad={() => void list.fetchNextPage()}
        />
      </PullToRefresh>
    </AppScreen>
  );
};
