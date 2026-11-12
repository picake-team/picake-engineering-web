import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronRight } from "lucide-react";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { LoadingSpinner } from "@/apps/web-seller/common/components/loading/LoadingSpinner";
import { useSellerNotifications } from "@/apps/web-seller/features/notification/components/providers/SellerNotificationProvider";
import type { SellerNotificationItem } from "@/apps/web-seller/features/notification/types/notification.dto";

const PREVIEW_LIMIT = 8;

function formatNotificationTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotificationDropdownItem(props: { item: SellerNotificationItem; onClick: () => void }) {
  const { item, onClick } = props;

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50",
          !item.read && "bg-primary/5",
        )}
      >
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
            item.read
              ? "border-zinc-200 bg-zinc-50 text-zinc-500"
              : "border-primary/25 bg-primary/[0.07] text-primary",
          )}
          aria-hidden
        >
          <Bell className="h-4 w-4" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <span className="block truncate text-sm font-medium leading-snug text-zinc-900">
            {item.title}
          </span>
          <p className="truncate text-xs text-zinc-500">{item.body}</p>
          <p className="text-[11px] text-zinc-400">{formatNotificationTime(item.createdAt)}</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={2} aria-hidden />
      </button>
    </li>
  );
}

/** 헤더 알림 아이콘 — 클릭 시 아이콘 아래 드롭다운으로 최근 알림 미리보기 */
export function AdminHeaderNotificationDropdown() {
  const navigate = useNavigate();
  const location = useLocation();
  const notif = useSellerNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const storeId = useMemo(() => {
    const m = location.pathname.match(/^\/stores\/([^/]+)/);
    return m ? m[1] : null;
  }, [location.pathname]);

  const previewItems = useMemo(() => (notif?.items ?? []).slice(0, PREVIEW_LIMIT), [notif?.items]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (!storeId || !notif) {
    return null;
  }

  const unread = notif.unreadCount;
  const hasUnread = notif.items.some((n) => !n.read);

  const onRowClick = (orderId: string, id: string) => {
    notif.markRead(id);
    setIsOpen(false);
    navigate(ROUTES.STORE_DETAIL_ORDERS_DETAIL(storeId, orderId));
  };

  const onViewAll = () => {
    setIsOpen(false);
    navigate(ROUTES.STORE_DETAIL_NOTIFICATIONS_LIST(storeId));
  };

  return (
    <div ref={containerRef} className="relative mr-1 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative text-zinc-700 hover:bg-zinc-100"
        aria-label={unread > 0 ? `알림 ${unread}건 읽지 않음` : "알림"}
      >
        <Bell className="h-6 w-6" />
        {unread > 0 ? (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white",
            )}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </Button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label="알림"
          className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-900">알림</h2>
              {unread > 0 ? (
                <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={notif.markAllRead}
              disabled={!hasUnread}
              className="shrink-0 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              모두 읽음
            </button>
          </div>

          <div className="max-h-[min(28rem,calc(100vh-8rem))] overflow-y-auto">
            {notif.isListLoading && previewItems.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
                <LoadingSpinner size="sm" aria-hidden />
                알림을 불러오는 중…
              </div>
            ) : previewItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-zinc-500">
                <Bell className="h-8 w-8 opacity-40" />
                <p className="text-sm">알림이 없습니다.</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {previewItems.map((item) => (
                  <NotificationDropdownItem
                    key={item.id}
                    item={item}
                    onClick={() => onRowClick(item.orderId, item.id)}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-zinc-200 bg-zinc-50/80 px-4 py-2.5">
            <button
              type="button"
              onClick={onViewAll}
              className="flex w-full items-center justify-center gap-1 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900"
            >
              알림 전체 보기
              <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
