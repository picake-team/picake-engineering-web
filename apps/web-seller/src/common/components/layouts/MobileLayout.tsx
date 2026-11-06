import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { rememberLastStoreId } from "@/apps/web-seller/common/utils/last-store.util";
import { SellerNotificationScope } from "@/apps/web-seller/features/notification/components/providers/SellerNotificationProvider";

/** 휴대폰 화면이 열리는 동안 잠깐 보이는 빈 화면(위쪽 줄 높이만큼 비움) */
function MobileScreenLoading() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col bg-white pt-[env(safe-area-inset-top)]">
      <div className="h-12" />
      <div className="flex flex-col gap-3 px-5 pt-4" aria-busy="true" aria-label="불러오는 중">
        <span className="block h-6 w-1/3 animate-pulse rounded-check bg-ink-50" />
        <span className="block h-24 w-full animate-pulse rounded-card bg-ink-50" />
        <span className="block h-24 w-full animate-pulse rounded-card bg-ink-50" />
      </div>
    </div>
  );
}

/**
 * 휴대폰 화면(판매자 앱 I-48)의 바깥 틀. 화면마다 `AppScreen`으로 위쪽 줄·아래 탭을 그리고,
 * 여기서는 PC 화면(AdminLayout)과 같은 스토어 알림(실시간 알림·소리)만 붙인다.
 */
export function MobileLayout() {
  const { pathname } = useLocation();
  const storeId = pathname.match(/^\/stores\/([^/]+)/)?.[1];
  useEffect(() => {
    if (storeId) rememberLastStoreId(storeId);
  }, [storeId]);
  return (
    <SellerNotificationScope>
      <div className="min-h-dvh bg-white">
        <Suspense fallback={<MobileScreenLoading />}>
          <Outlet />
        </Suspense>
      </div>
    </SellerNotificationScope>
  );
}
