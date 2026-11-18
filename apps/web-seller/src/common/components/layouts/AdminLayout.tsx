import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { Menu, User, LogOut, UserCircle } from "lucide-react";
import { AdminSidebar } from "@/apps/web-seller/common/components/sidebar/AdminSidebar";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { isActAsMode } from "@/apps/web-seller/common/utils/act-as.util";
import { useAuthStore } from "@/apps/web-seller/features/auth/store/auth.store";
import { useLogout } from "@/apps/web-seller/features/auth/hooks/mutations/useAuthMutation";
import { SellerNotificationScope } from "@/apps/web-seller/features/notification/components/providers/SellerNotificationProvider";
import { AdminHeaderNotificationDropdown } from "@/apps/web-seller/features/notification/components/AdminHeaderNotificationDropdown";

const drawerWidth = 300;

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(!isMobile);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const actAs = isActAsMode();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated } = useAuthStore();
  const logoutMutation = useLogout();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && mobileOpen) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileOpen]);

  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isProfileMenuOpen]);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setIsDrawerOpen(!isDrawerOpen);
    }
  };

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    logoutMutation.mutate();
  };

  return (
    <SellerNotificationScope>
      <div className="flex min-h-screen">
        {/* 헤더 */}
        <header
          className={`fixed top-[var(--act-as-band,0px)] right-0 z-10 bg-white border-b border-zinc-200 text-zinc-900 transition-all duration-300 ${
            isDrawerOpen && !isMobile ? `left-[${drawerWidth}px]` : "left-0"
          }`}
          style={{
            width: isDrawerOpen && !isMobile ? `calc(100% - ${drawerWidth}px)` : "100%",
            marginLeft: isDrawerOpen && !isMobile ? `${drawerWidth}px` : 0,
          }}
        >
          <div className="flex items-center h-16 px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDrawerToggle}
              className="mr-2 text-zinc-700 hover:bg-zinc-100"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="flex-1 text-xl font-semibold text-zinc-900">판매자 관리 시스템</h1>
            {/* 운영자 대신 입력 중(기획 I-41)에는 스토어 만들기·마이페이지·로그아웃을 감춘다(끝내기는 맨 위 띠) */}
            {!actAs && (
              <Button
                variant="ghost"
                onClick={() => navigate(ROUTES.STORE_CREATE)}
                className="mr-2 text-zinc-700 hover:bg-zinc-100"
              >
                스토어 만들기
              </Button>
            )}
            {isAuthenticated && (
              <div className="flex items-center">
                <AdminHeaderNotificationDropdown />
                {!actAs && (
                  <div ref={profileMenuRef} className="relative flex shrink-0 items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      aria-expanded={isProfileMenuOpen}
                      aria-haspopup="menu"
                      className="text-zinc-700 hover:bg-zinc-100"
                    >
                      <User className="h-6 w-6" />
                    </Button>
                    {isProfileMenuOpen ? (
                      <div
                        role="menu"
                        className="absolute right-0 top-full z-50 mt-2 w-52 rounded-md border border-zinc-200 bg-white py-1 shadow-lg"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            navigate(ROUTES.MYPAGE);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100"
                        >
                          <UserCircle className="h-4 w-4 shrink-0" />
                          마이페이지
                        </button>
                        <div className="my-1 border-t border-zinc-200" />
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          disabled={logoutMutation.isPending}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 disabled:opacity-50"
                        >
                          <LogOut className="h-4 w-4" />
                          로그아웃
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* 사이드바 */}
        <AdminSidebar
          isMobile={isMobile}
          open={isMobile ? mobileOpen : isDrawerOpen}
          onToggle={handleDrawerToggle}
          drawerWidth={drawerWidth}
        />

        {/* 메인 콘텐츠 */}
        <main
          className="flex-1 p-6 pt-20 transition-all duration-300"
          style={{
            marginLeft: isDrawerOpen && !isMobile ? `${drawerWidth}px` : 0,
            width: isDrawerOpen && !isMobile ? `calc(100% - ${drawerWidth}px)` : "100%",
          }}
        >
          {children}
        </main>
      </div>
    </SellerNotificationScope>
  );
};
