import React from "react";
import { ChevronLeft } from "lucide-react";
import { getMenuItems } from "@/apps/web-admin/common/constants/menu.constant";
import { useLocation, useNavigate } from "react-router-dom";
import { BaseButton as Button } from "@/apps/web-admin/common/components/buttons/BaseButton";
import { cn } from "@/apps/web-admin/common/utils/classname.util";
import { AdminAppLogo } from "@/apps/web-admin/common/components/branding/AdminAppLogo";

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
  // 상세 화면(예: /consumer/quote-requests/:id)에서도 그 메뉴를 고른 것으로 보인다
  const isActivePath = (path?: string) =>
    !!path && (currentPath === path || currentPath.startsWith(`${path}/`));

  const menuItems = React.useMemo(() => getMenuItems(), []);

  const onNavigate = (path: string) => {
    navigate(path);
    if (isMobile) onToggle();
  };

  return (
    <>
      {isMobile && open && <div className="fixed inset-0 bg-black/50 z-40" onClick={onToggle} />}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-[#1a1a1a] border-r border-zinc-800 z-50 transition-transform duration-300",
          isMobile && !open && "-translate-x-full",
          !isMobile && !open && "-translate-x-full",
        )}
        style={{ width: drawerWidth }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-4 border-b border-zinc-800 gap-2">
            <div className="flex-1 min-w-0 text-sm font-medium truncate text-zinc-100">PICAKE</div>
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

          <nav className="min-h-0 flex-1 overflow-y-auto">
            <ul className="p-2 space-y-1">
              {menuItems.map((item) => {
                const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                const isParentSelected =
                  currentPath === (item.path ?? "") ||
                  (hasChildren && item.children!.some((c) => isActivePath(c.path)));

                return (
                  <li key={item.text}>
                    <button
                      type="button"
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
                    </button>

                    {hasChildren && (
                      <ul className="pl-8 mt-1 space-y-1">
                        {item.children!.map((child) => (
                          <li key={child.text}>
                            <button
                              type="button"
                              onClick={() => onNavigate(child.path)}
                              className={cn(
                                "w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                                isActivePath(child.path)
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
                <AdminAppLogo width={32} className="max-h-8" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Picake
                </p>
                <p className="truncate text-sm font-medium text-zinc-200">관리자 센터</p>
              </div>
            </div>
          </footer>
        </div>
      </aside>
    </>
  );
};
