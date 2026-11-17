import React from "react";
import { ChevronLeft } from "lucide-react";
import { getMenuItems } from "@/apps/web-seller/common/constants/menu.constant";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { useLocation, useNavigate } from "react-router-dom";
import { useStoreList } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import { flattenAndDeduplicateInfiniteData } from "@/apps/web-seller/common/utils/pagination.util";
import type { StoreResponseDto } from "@/apps/web-seller/features/store/types/store.dto";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/apps/web-seller/common/components/selects/Select";
import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { useSellerNotifications } from "@/apps/web-seller/features/notification/components/providers/SellerNotificationProvider";
import { SellerAppLogo } from "@/apps/web-seller/common/components/branding/SellerAppLogo";

interface AdminSidebarProps {
  isMobile: boolean;
  open: boolean;
  onToggle: () => void;
  drawerWidth: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isMobile,
  open,
  onToggle,
  drawerWidth,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const { data: storeListData } = useStoreList();
  const stores = React.useMemo(() => {
    if (!storeListData) return [];
    return flattenAndDeduplicateInfiniteData<StoreResponseDto>(storeListData);
  }, [storeListData]);

  const storeIdFromPath = React.useMemo(() => {
    const match = currentPath.match(/^\/stores\/([^/]+)/);
    return match ? match[1] : null;
  }, [currentPath]);
  const isStoreScopedPath = React.useMemo(() => currentPath.startsWith("/stores/"), [currentPath]);
  const isValidStoreId = React.useMemo(
    () => (storeIdFromPath ? stores.some((s) => s.id === storeIdFromPath) : false),
    [storeIdFromPath, stores],
  );
  const sellerNotif = useSellerNotifications();
  const unreadNotifCount = sellerNotif?.unreadCount ?? 0;

  const menuItems = React.useMemo(() => {
    // 1) 스토어 범위 경로 + 유효한 storeId일 때만 스토어 메뉴 노출
    if (isStoreScopedPath && isValidStoreId) {
      return getMenuItems(storeIdFromPath);
    }
    // 2) 스토어가 없고 ROOT 경로일 때는 홈 메뉴만 노출
    if (!isStoreScopedPath && stores.length === 0 && currentPath === ROUTES.ROOT) {
      return getMenuItems(null);
    }
    // 3) 그 외(유효하지 않은 storeId, 비스토어 경로 등)에는 아무 메뉴도 노출하지 않음
    return [];
  }, [isStoreScopedPath, isValidStoreId, storeIdFromPath, stores.length, currentPath]);

  const onNavigate = (path: string) => {
    navigate(path);
    if (isMobile) onToggle();
  };

  const onSelectStore = (id: string) => {
    onNavigate(ROUTES.STORE_DETAIL_HOME(id));
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && open && <div className="fixed inset-0 bg-black/50 z-40" onClick={onToggle} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-[var(--act-as-band,0px)] bottom-0 left-0 bg-[#1a1a1a] border-r border-zinc-800 z-50 transition-transform duration-300",
          isMobile && !open && "-translate-x-full",
          !isMobile && !open && "-translate-x-full",
        )}
        style={{ width: drawerWidth }}
      >
        <div className="flex flex-col h-full">
          {/* Toolbar */}
          <div className="flex items-center h-16 px-4 border-b border-zinc-800 gap-2">
            {stores.length > 0 ? (
              <div className="flex-1 min-w-0">
                <Select value={storeIdFromPath || ""} onValueChange={onSelectStore}>
                  <SelectTrigger className="h-9 w-full bg-zinc-800 text-zinc-100 border-zinc-700 hover:bg-zinc-700">
                    <SelectValue placeholder="스토어 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {stores.map((s) => (
                      <SelectItem
                        key={s.id}
                        value={s.id}
                        className="text-zinc-100 hover:bg-zinc-700 focus:bg-zinc-700"
                      >
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex-1 text-sm font-medium truncate text-zinc-100">PICAKE</div>
            )}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="flex-shrink-0 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="min-h-0 flex-1 overflow-y-auto">
            <ul className="p-2 space-y-1">
              {menuItems.map((item) => {
                const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                const isParentSelected =
                  currentPath === (item.path ?? "") ||
                  (hasChildren && item.children!.some((c) => c.path === currentPath));

                return (
                  <li key={item.text}>
                    <button
                      onClick={() => {
                        if (item.path) {
                          onNavigate(item.path);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isParentSelected
                          ? "bg-zinc-700 text-zinc-50"
                          : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50",
                      )}
                    >
                      {item.icon && (
                        <span className="flex-shrink-0 w-5 h-5 text-inherit">{item.icon}</span>
                      )}
                      <span className="flex-1 text-left">{item.text}</span>
                      {item.text === "알림" && unreadNotifCount > 0 ? (
                        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                          {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
                        </span>
                      ) : null}
                    </button>

                    {hasChildren && (
                      <ul className="pl-8 mt-1 space-y-1">
                        {item.children!.map((child) => (
                          <li key={child.text}>
                            <button
                              onClick={() => onNavigate(child.path)}
                              className={cn(
                                "w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                                currentPath === child.path
                                  ? "bg-zinc-700 text-zinc-50"
                                  : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50",
                              )}
                            >
                              <span className="flex-1 text-left">{child.text}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <footer className="shrink-0 border-t border-zinc-800/90 bg-zinc-900/50 px-4 py-3.5">
            <div className="flex items-center gap-3 rounded-lg border border-zinc-800/80 bg-zinc-800/40 px-3 py-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/95 p-1 shadow-sm">
                <SellerAppLogo width={32} className="max-h-8" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Picake
                </p>
                <p className="truncate text-sm font-medium text-zinc-200">판매자 센터</p>
              </div>
            </div>
          </footer>
        </div>
      </aside>
    </>
  );
};
