/**
 * PC 왼쪽 메뉴 항목과 지금 메뉴 고르기(기획 I-54). 화면(DesktopNav)과 테스트가 같이 쓴다.
 */
import type { IconName, TabIconName } from "@/apps/web-seller/common/ui/icons";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";

/** 스토어 주소 뒤쪽(/stores/:id 다음)으로 지금 메뉴를 고른다 */
export type Matcher = (rest: string, pathname: string) => boolean;

export interface NavItem {
  key: string;
  label: string;
  tab?: TabIconName;
  line?: IconName;
  to: (storeId: string) => string;
  match: Matcher;
}

const starts =
  (...prefixes: string[]): Matcher =>
  (rest) =>
    prefixes.some((p) => rest === p || rest.startsWith(`${p}/`));

export const DESKTOP_NAV_ITEMS: NavItem[] = [
  {
    key: "home",
    label: "홈",
    tab: "home",
    to: ROUTES.STORE_DETAIL_HOME,
    match: (r) => r === "" || r === "/welcome",
  },
  {
    key: "orders",
    label: "주문",
    tab: "orders",
    to: ROUTES.STORE_DETAIL_ORDERS_LIST,
    match: starts("/orders"),
  },
  {
    key: "calendar",
    label: "캘린더",
    tab: "calendar",
    to: ROUTES.STORE_DETAIL_CALENDAR,
    match: starts("/calendar", "/manual-orders", "/print"),
  },
  {
    key: "products",
    label: "상품",
    tab: "products",
    to: ROUTES.STORE_DETAIL_PRODUCTS,
    match: starts("/products"),
  },
  {
    key: "chat",
    label: "채팅",
    tab: "chat",
    to: ROUTES.STORE_DETAIL_CHATS,
    match: starts("/chats"),
  },
  {
    key: "stats",
    label: "통계",
    tab: "stats",
    to: ROUTES.STORE_DETAIL_STATISTICS_ORDERS,
    match: starts("/statistics"),
  },
  {
    key: "store",
    label: "스토어",
    tab: "store",
    to: ROUTES.STORE_DETAIL_MENU,
    match: starts("/menu", "/edit", "/feed", "/hours"),
  },
];

export const DESKTOP_NAV_BOTTOM: NavItem[] = [
  {
    key: "notifications",
    label: "알림",
    line: "bell",
    to: ROUTES.STORE_DETAIL_NOTIFICATIONS_LIST,
    match: (r) => r === "/notifications",
  },
  {
    key: "settings",
    label: "설정",
    line: "settings",
    to: ROUTES.STORE_DETAIL_SETTINGS,
    match: (r, pathname) =>
      starts("/settings", "/notifications/settings")(r, pathname) ||
      pathname.startsWith(ROUTES.MYPAGE),
  },
];

/** 지금 주소에서 고른 메뉴 key(없으면 null). 테스트에서도 쓴다 */
export function activeNavKey(pathname: string, storeId: string): string | null {
  const base = `/stores/${storeId}`;
  const rest = pathname.startsWith(base) ? pathname.slice(base.length).replace(/\/$/, "") : "";
  const inStore = pathname.startsWith(base);
  for (const item of [...DESKTOP_NAV_ITEMS, ...DESKTOP_NAV_BOTTOM]) {
    if (!inStore && !item.key.startsWith("settings")) continue;
    if (item.match(rest, pathname)) return item.key;
  }
  return null;
}
