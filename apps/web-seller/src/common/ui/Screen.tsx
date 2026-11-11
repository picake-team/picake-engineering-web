/**
 * 휴대폰 화면의 틀 (위쪽 줄 2가지, 아래 탭 P091, I-48 화면 원칙).
 *
 * - 아래 탭 화면 5개(홈·주문·캘린더·상품·스토어): 큰 제목 24 + 아래 탭
 * - 안쪽 화면: 뒤로 + 제목 16(굵게, 높이 52), 아래 탭 없음
 * - 위쪽 줄과 아래 탭·아래 붙은 버튼은 휴대폰이 알려 주는 안전 영역만큼 띄운다
 * - 입력 중(키보드가 올라옴)에는 아래 탭과 아래 붙은 버튼을 숨긴다(손님 앱과 같게)
 * - 화면은 문서 스크롤을 쓴다(위쪽 줄은 sticky). PC에서는 가운데 640 칸에 둔다
 */
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { Icon, TabIcon, type TabIconName } from "@/apps/web-seller/common/ui/icons";
import { HeaderIconButton } from "@/apps/web-seller/common/ui/Button";
import { useKeyboardOpen } from "@/apps/web-seller/common/hooks/useKeyboardOpen";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { useSellerChatUnread } from "@/apps/web-seller/features/chat/hooks/useChat";

/** 화면 칸 너비(손님 웹 PC 가운데 칸과 같은 값) */
export const APP_COLUMN_CLASS = "mx-auto w-full max-w-[640px]";

export type AppTab = TabIconName;

/**
 * 홈 · 주문 · 상품 · 채팅 · 스토어(운영자 결정 2026-11-11, 기획 I-11). 캘린더는 탭에서 빠지고
 * 홈 주간 달력 위 "캘린더 보기"로 간다(주소 /stores/:id/calendar는 그대로, PC 왼쪽 메뉴도 그대로)
 */
const TABS: { tab: AppTab; label: string; to: (storeId: string) => string }[] = [
  { tab: "home", label: "홈", to: ROUTES.STORE_DETAIL_HOME },
  { tab: "orders", label: "주문", to: ROUTES.STORE_DETAIL_ORDERS_LIST },
  { tab: "products", label: "상품", to: ROUTES.STORE_DETAIL_PRODUCTS },
  { tab: "chat", label: "채팅", to: ROUTES.STORE_DETAIL_CHATS },
  { tab: "store", label: "스토어", to: ROUTES.STORE_DETAIL_MENU },
];

/** 아래 탭(탭 첫 화면 5개에만). 고른 탭 11/700 #B5401C, 아닌 탭 11/400 #686864 */
export function AppTabBar({ storeId, current }: { storeId: string; current: AppTab }) {
  // 누른 탭은 다음 화면이 그려지기 전에도 바로 고른 탭으로 보인다(느린 인터넷에서 0.15~0.25초 빈틈)
  const [tapped, setTapped] = useState<AppTab | null>(null);
  const shownTab = tapped ?? current;
  // 채팅 탭 숫자: 안 읽은 방 수(채팅이 닫혀 있으면 없음)
  const { data: chatUnread } = useSellerChatUnread(storeId);
  const chatCount = chatUnread?.open ? chatUnread.unreadThreads : 0;
  return (
    <nav
      aria-label="아래 탭"
      className="grid grid-cols-5 border-t border-ink-100 bg-white px-2 pb-[max(4px,env(safe-area-inset-bottom))] pt-1"
    >
      {TABS.map(({ tab, label, to }) => {
        const active = tab === current;
        const on = tab === shownTab;
        return (
          <NavLink
            key={tab}
            to={to(storeId)}
            // NavLink는 홈(/stores/:id)을 모든 하위 주소에서 "지금 화면"으로 보므로 직접 정한다
            aria-current={active ? "page" : "false"}
            onClick={(e) => {
              if (!active) {
                setTapped(tab);
                return;
              }
              // 보고 있는 탭을 다시 누르면 맨 위로
              e.preventDefault();
              const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
            }}
            className="flex min-h-11 flex-col items-center gap-1 pb-1 pt-2 font-app"
          >
            <span className="relative">
              <TabIcon name={tab} active={on} />
              {tab === "chat" && chatCount > 0 ? (
                <span
                  aria-label={`안 읽은 채팅 ${chatCount}`}
                  className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white"
                >
                  {chatCount > 99 ? "99+" : chatCount}
                </span>
              ) : null}
            </span>
            <span
              className={cx("text-tab", on ? "font-bold text-brand" : "font-normal text-ink-600")}
            >
              {label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

/** 아래 탭 화면의 위쪽 줄: 큰 제목 24 + 오른쪽 아이콘(44) */
export function TabHeader({
  title,
  actions,
  sub,
}: {
  title: React.ReactNode;
  actions?: React.ReactNode;
  /** 제목 아래 한 줄(필요한 화면만) */
  sub?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-2 px-5 pb-2 pt-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="truncate font-app text-title font-bold text-ink-900">{title}</h1>
        {sub}
      </div>
      {actions ? <div className="-mr-3 flex shrink-0 items-center">{actions}</div> : null}
    </div>
  );
}

/** 안쪽 화면의 위쪽 줄: 뒤로(44) + 제목 16/700, 높이 52 */
export function BackHeader({
  title,
  onBack,
  actions,
  backLabel = "뒤로",
  icon = "back",
  noBack = false,
}: {
  title: React.ReactNode;
  /** 없으면 브라우저 뒤로 */
  onBack?: () => void;
  actions?: React.ReactNode;
  backLabel?: string;
  /** 창처럼 닫는 화면은 close */
  icon?: "back" | "close";
  /** 돌아갈 곳이 없는 화면(스토어가 없을 때의 스토어 만들기 SC-65)은 뒤로를 그리지 않는다 */
  noBack?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex h-12 items-center px-2">
      {noBack ? null : (
        <button
          type="button"
          aria-label={backLabel}
          onClick={onBack ?? (() => navigate(-1))}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-900 active:bg-ink-50"
        >
          <Icon name={icon} size={24} strokeWidth={1.8} />
        </button>
      )}
      <h1
        className={cx(
          "min-w-0 flex-1 truncate font-app text-body font-bold text-ink-900",
          noBack ? "ml-3" : "ml-0.5",
        )}
      >
        {title}
      </h1>
      {actions ? <div className="flex shrink-0 items-center">{actions}</div> : null}
    </div>
  );
}

/** 홈·스토어 탭 위쪽 줄의 스토어 이름(18/700). 스토어가 2개 이상이면 ▾를 붙여 누르면 바꾼다 */
export function StoreNameButton({
  name,
  switchable,
  onClick,
}: {
  name: string;
  switchable: boolean;
  onClick: () => void;
}) {
  if (!switchable) {
    return <span className="truncate font-app text-group font-bold text-ink-900">{name}</span>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className="-ml-1 inline-flex min-h-11 min-w-0 items-center gap-1 rounded-control px-1 font-app text-group font-bold text-ink-900 active:bg-ink-50"
    >
      <span className="truncate">{name}</span>
      <span className="shrink-0 text-ink-600">
        <Icon name="chevronDown" size={18} strokeWidth={2} />
      </span>
      <span className="sr-only">스토어 바꾸기</span>
    </button>
  );
}

/** 홈 위쪽 줄: 스토어 이름 + 종(안 읽은 알림 수) */
export function HomeHeader({
  storeName,
  switchable,
  onSwitchStore,
  unreadCount,
  onOpenNotifications,
}: {
  storeName: string;
  switchable: boolean;
  onSwitchStore: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
}) {
  return (
    <div className="flex h-12 items-center justify-between gap-2 pl-5 pr-3 pt-2">
      <StoreNameButton name={storeName} switchable={switchable} onClick={onSwitchStore} />
      <HeaderIconButton
        icon="bell"
        label="알림"
        count={unreadCount}
        onClick={onOpenNotifications}
      />
    </div>
  );
}

/**
 * 화면 틀. header는 위에 붙고(sticky), footer(아래 붙은 버튼 띠)와 아래 탭은 아래에 붙는다.
 * 본문 좌우 여백 20은 여기서 준다(가득 찬 회색 띠는 GrayBand가 -20으로 넘긴다).
 */
export function AppScreen({
  header,
  footer,
  tab,
  storeId,
  children,
  className,
  bodyClassName,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /** 아래 탭 화면이면 그 탭 */
  tab?: AppTab;
  /** 아래 탭 링크에 쓸 스토어(tab이 있으면 필요) */
  storeId?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const keyboardOpen = useKeyboardOpen();
  return (
    <div
      className={cx(
        APP_COLUMN_CLASS,
        "flex min-h-dvh flex-col bg-white font-app text-ink-900 [word-break:keep-all]",
        className,
      )}
    >
      {header ? (
        <header className="sticky top-0 z-20 bg-white pt-[env(safe-area-inset-top)]">
          {header}
        </header>
      ) : (
        <div className="pt-[env(safe-area-inset-top)]" />
      )}
      <main className={cx("flex flex-1 flex-col gap-3 px-5 pb-6 pt-1", bodyClassName)}>
        {children}
      </main>
      {footer && !keyboardOpen ? <div className="sticky bottom-0 z-20">{footer}</div> : null}
      {tab && storeId && !keyboardOpen ? (
        <div className="sticky bottom-0 z-20">
          <AppTabBar storeId={storeId} current={tab} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * 아래 붙은 버튼 띠: 위 12 · 좌우 20 · 아래는 안전 영역(없으면 12).
 * 디자인의 아래 28은 홈 막대를 그린 값이라 휴대폰이 알려 주는 안전 영역으로 바꿨다(I-48 "안전 영역").
 * 못 누르는 이유는 버튼 바로 위 한 줄.
 */
export function BottomActionBar({
  reason,
  onReasonClick,
  children,
}: {
  /** 못 누르는 이유(13/600 #B5401C). onReasonClick이 있으면 눌러서 그곳으로 */
  reason?: React.ReactNode;
  onReasonClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 font-app shadow-[0_-6px_20px_rgba(31,31,30,0.07)]">
      {reason ? (
        onReasonClick ? (
          <button
            type="button"
            onClick={onReasonClick}
            className="-my-2 flex min-h-11 items-center gap-1.5 self-start text-left text-caption font-semibold text-ink-900"
          >
            <span className="shrink-0 text-brand">
              <Icon name="warning" size={16} strokeWidth={2} />
            </span>
            {reason}
            <span className="shrink-0 text-ink-400">
              <Icon name="chevronRight" size={14} strokeWidth={2} />
            </span>
          </button>
        ) : (
          <p
            role="status"
            className="flex items-center gap-1.5 text-caption font-semibold text-ink-900"
          >
            <span className="shrink-0 text-brand">
              <Icon name="warning" size={16} strokeWidth={2} />
            </span>
            {reason}
          </p>
        )
      ) : null}
      {children}
    </div>
  );
}
