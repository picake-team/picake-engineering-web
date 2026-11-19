/**
 * PC 틀 왼쪽 메뉴(기획 I-54, 시안 D: B 구조 + A 색).
 *
 * - 이름은 휴대폰 아래 탭과 같고(홈·주문·상품·채팅·스토어), 휴대폰에서 안쪽에 있던 캘린더·통계를 메뉴로 꺼낸다.
 *   아래쪽에 알림·설정.
 * - 1200 이상: 아이콘 + 이름(넓이 240). 768~1199: 아이콘 줄(넓이 88, 이름은 아이콘 아래 작게).
 * - 고른 메뉴: 회색 바탕 + 주황으로 칠한 아이콘 + 작은 주황 글씨(휴대폰 아래 탭과 같은 색).
 * - 숫자: 주문 = 처리할 것, 채팅 = 안 읽은 방, 알림 = 안 읽은 알림.
 */
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { Icon, TabIcon } from "@/apps/web-seller/common/ui/icons";
import {
  DESKTOP_NAV_BOTTOM,
  DESKTOP_NAV_ITEMS,
  activeNavKey,
  type NavItem,
} from "@/apps/web-seller/common/components/layouts/desktop-nav.items";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import { useMyStores } from "@/apps/web-seller/features/store/hooks/queries/useMyStores";
import { StoreSwitchSheet } from "@/apps/web-seller/features/store/components/mobile/StoreSwitchSheet";
import { useSellerChatUnread } from "@/apps/web-seller/features/chat/hooks/useChat";
import { useSellerNotifications } from "@/apps/web-seller/features/notification/components/providers/SellerNotificationProvider";
import { useOrderStatusGroup } from "@/apps/web-seller/features/order/hooks/queries/useOrderMobileQuery";
import { groupsForTab } from "@/apps/web-seller/features/order/utils/order-mobile.util";

const TODO_GROUPS = groupsForTab("todo");

function useTodoCount(storeId: string): number {
  // 홈 "처리할 일"·주문 탭 숫자와 같은 조회(캐시를 같이 쓴다)
  const a = useOrderStatusGroup(storeId, TODO_GROUPS[0].status);
  const b = useOrderStatusGroup(storeId, TODO_GROUPS[1].status);
  const c = useOrderStatusGroup(storeId, TODO_GROUPS[2].status);
  const d = useOrderStatusGroup(storeId, TODO_GROUPS[3].status);
  return [a, b, c, d].reduce((sum, q) => sum + (q.total ?? 0), 0);
}

function Count({ value, rail }: { value: number; rail: boolean }) {
  if (!value) return null;
  return (
    <span
      className={cx(
        "flex items-center justify-center rounded-full bg-brand font-bold tabular-nums leading-none text-white",
        rail
          ? "absolute right-3 top-1 h-[18px] min-w-[18px] px-1 text-[10px]"
          : "ml-auto h-5 min-w-5 px-1.5 text-badge",
      )}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

function NavLinkRow({
  item,
  storeId,
  active,
  rail,
  count,
}: {
  item: NavItem;
  storeId: string;
  active: boolean;
  rail: boolean;
  count?: number;
}) {
  return (
    <Link
      to={item.to(storeId)}
      aria-current={active ? "page" : undefined}
      aria-label={rail && count ? `${item.label} ${count}` : undefined}
      className={cx(
        "relative flex items-center rounded-control font-app transition-colors duration-fast",
        rail
          ? "mx-auto h-[62px] w-[72px] flex-col justify-center gap-1 text-tab"
          : "h-12 gap-3 px-3 text-body",
        active
          ? cx("bg-ink-50 text-brand-ink", rail ? "font-bold" : "font-bold")
          : cx("text-ink-700 hover:bg-ink-50", rail ? "font-normal text-ink-600" : "font-semibold"),
      )}
    >
      {item.tab ? (
        <TabIcon name={item.tab} active={active} size={rail ? 24 : 22} />
      ) : item.line ? (
        <span className={active ? "text-brand" : "text-ink-400"}>
          <Icon name={item.line} size={rail ? 24 : 22} strokeWidth={1.8} />
        </span>
      ) : null}
      <span className={cx(rail ? "leading-none" : "min-w-0 truncate")}>{item.label}</span>
      <Count value={count ?? 0} rail={rail} />
    </Link>
  );
}

export function DesktopNav({ storeId, expanded }: { storeId: string; expanded: boolean }) {
  const { pathname } = useLocation();
  const rail = !expanded;
  const active = activeNavKey(pathname, storeId);
  const { data: store } = useStoreDetail(storeId);
  const { stores } = useMyStores();
  const [switchOpen, setSwitchOpen] = useState(false);
  const todo = useTodoCount(storeId);
  const chat = useSellerChatUnread(storeId);
  const notifications = useSellerNotifications();
  const counts: Record<string, number> = {
    orders: todo,
    chat: chat.data?.unreadThreads ?? 0,
    notifications: notifications?.unreadCount ?? 0,
  };
  const name = store?.name ?? "";

  return (
    <aside
      aria-label="메뉴"
      className={cx(
        "sticky top-[var(--act-as-band,0px)] flex h-[calc(100dvh-var(--act-as-band,0px))] shrink-0 flex-col overflow-y-auto border-r border-ink-100 bg-white font-app print:hidden",
        rail ? "w-[88px] items-stretch px-2 py-4" : "w-[240px] px-3.5 py-[18px]",
      )}
    >
      <button
        type="button"
        onClick={() => setSwitchOpen(true)}
        aria-haspopup="dialog"
        aria-label={rail ? `${name} · 스토어 바꾸기` : undefined}
        className={cx(
          "flex items-center rounded-control text-left font-app text-ink-900 hover:bg-ink-50",
          rail
            ? "mx-auto mb-3 size-11 justify-center bg-ink-50 text-body font-bold"
            : "mb-3 min-h-11 gap-1.5 px-2.5 text-group font-bold",
        )}
      >
        {rail ? (
          <span aria-hidden="true">{name.slice(0, 1)}</span>
        ) : (
          <>
            <span className="min-w-0 truncate">{name}</span>
            <span className="shrink-0 text-ink-400">
              <Icon name="chevronDown" size={16} strokeWidth={2} />
            </span>
            <span className="sr-only">{stores.length > 1 ? "스토어 바꾸기" : "스토어"}</span>
          </>
        )}
      </button>

      <nav className="flex flex-col gap-0.5" aria-label="스토어 메뉴">
        {DESKTOP_NAV_ITEMS.map((item) => (
          <NavLinkRow
            key={item.key}
            item={item}
            storeId={storeId}
            active={active === item.key}
            rail={rail}
            count={counts[item.key]}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 pt-4">
        {DESKTOP_NAV_BOTTOM.map((item) => (
          <NavLinkRow
            key={item.key}
            item={item}
            storeId={storeId}
            active={active === item.key}
            rail={rail}
            count={counts[item.key]}
          />
        ))}
      </div>

      <StoreSwitchSheet
        open={switchOpen}
        currentStoreId={storeId}
        onClose={() => setSwitchOpen(false)}
      />
    </aside>
  );
}
