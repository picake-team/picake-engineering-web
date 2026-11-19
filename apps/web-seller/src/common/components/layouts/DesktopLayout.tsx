/**
 * PC 틀(기획 I-54, 폭 768 이상). 왼쪽 메뉴 + 본문.
 *
 * - 휴대폰 화면 틀(MobileLayout)과 같은 주소·같은 기능을 쓴다. 주소마다 PC 화면이 따로 있으면 그것을,
 *   없으면 휴대폰 화면을 PC 틀 안에 그린다(paths.constant의 desktop 칸).
 * - ShellContext = "desktop": 화면 틀(AppScreen)은 아래 탭을 그리지 않고, 아래 창은 가운데 창이 된다.
 * - 위쪽 안내 띠·되돌리기 띠가 왼쪽 메뉴를 피해 본문 가운데에 오도록 메뉴 넓이를 --shell-left로 알린다.
 * - 스토어가 없는 주소(/mypage, /store/create)에서는 마지막으로 연 스토어로 메뉴를 그린다(스토어가 없으면 메뉴 없음).
 */
import { Suspense, useEffect, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ShellContext } from "@/apps/web-seller/common/ui/shell";
import { DesktopNav } from "@/apps/web-seller/common/components/layouts/DesktopNav";
import { useMinWidth } from "@/apps/web-seller/common/hooks/useShowMobileScreens";
import { NAV_EXPANDED_MIN_WIDTH_PX } from "@/apps/web-seller/common/constants/screen.constant";
import {
  readLastStoreId,
  rememberLastStoreId,
} from "@/apps/web-seller/common/utils/last-store.util";
import { isActAsMode } from "@/apps/web-seller/common/utils/act-as.util";
import { useMyStores } from "@/apps/web-seller/features/store/hooks/queries/useMyStores";
import { SellerNotificationScope } from "@/apps/web-seller/features/notification/components/providers/SellerNotificationProvider";

export const DESKTOP_NAV_WIDTH = { expanded: 240, rail: 88 } as const;

/** PC 화면이 열리는 동안 잠깐 보이는 빈 화면 */
function DesktopScreenLoading() {
  return (
    <div className="flex flex-col gap-4 px-8 pt-6" aria-busy="true" aria-label="불러오는 중">
      <span className="block h-8 w-40 animate-pulse rounded-check bg-ink-50" />
      <div className="grid grid-cols-3 gap-4">
        <span className="block h-28 animate-pulse rounded-card bg-ink-50" />
        <span className="block h-28 animate-pulse rounded-card bg-ink-50" />
        <span className="block h-28 animate-pulse rounded-card bg-ink-50" />
      </div>
      <span className="block h-72 w-full animate-pulse rounded-card bg-ink-50" />
    </div>
  );
}

export function DesktopLayout() {
  const { pathname } = useLocation();
  const pathStoreId = pathname.match(/^\/stores\/([^/]+)/)?.[1];
  const { stores } = useMyStores();
  const last = readLastStoreId();
  const navStoreId =
    pathStoreId ?? (last && stores.some((s) => s.id === last) ? last : stores[0]?.id);
  const expanded = useMinWidth(NAV_EXPANDED_MIN_WIDTH_PX);
  const navWidth = navStoreId
    ? expanded
      ? DESKTOP_NAV_WIDTH.expanded
      : DESKTOP_NAV_WIDTH.rail
    : 0;

  useEffect(() => {
    // 운영자 대신 입력 중(기획 I-41)에는 운영자 브라우저에 사장님 스토어를 기억하지 않는다
    if (pathStoreId && !isActAsMode()) rememberLastStoreId(pathStoreId);
  }, [pathStoreId]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--shell-left", `${navWidth}px`);
    return () => {
      root.style.removeProperty("--shell-left");
    };
  }, [navWidth]);

  return (
    <ShellContext.Provider value="desktop">
      <SellerNotificationScope>
        <div className="flex min-h-dvh bg-white">
          {navStoreId ? <DesktopNav storeId={navStoreId} expanded={expanded} /> : null}
          <div className="min-w-0 flex-1">
            <Suspense fallback={<DesktopScreenLoading />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </SellerNotificationScope>
    </ShellContext.Provider>
  );
}
