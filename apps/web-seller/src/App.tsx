import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AdminLayout } from "@/apps/web-seller/common/components/layouts/AdminLayout";
import { MobileLayout } from "@/apps/web-seller/common/components/layouts/MobileLayout";
import {
  ROUTES,
  AUTH_ROUTE_CONFIG,
  ADMIN_ROUTE_CONFIG,
  type AppRouteConfig,
} from "@/apps/web-seller/common/constants/paths.constant";
import { AuthInitializerProvider } from "@/apps/web-seller/features/auth/components/providers/AuthInitializer";
import { useShowMobileScreens } from "@/apps/web-seller/common/hooks/useShowMobileScreens";
import { AlertBannerHost } from "@/apps/web-seller/common/ui/AlertBannerHost";
import { SnackbarHost } from "@/apps/web-seller/common/ui/Snackbar";
import { SellerAppBridgeProvider } from "@/apps/web-seller/common/components/providers/SellerAppBridgeProvider";
import { ErrorBoundaryProvider } from "./common/components/providers/ErrorBoundaryProvider";
import { QueryProvider } from "./common/components/providers/QueryProvider";
import { PostHogProvider, PostHogPageView } from "./common/components/providers/PostHogProvider";
import { LoadingFallback } from "./common/components/fallbacks/LoadingFallback";
import { Alert } from "./common/components/alerts/Alert";
import { ConfirmAlert } from "./common/components/alerts/ConfirmAlert";
import BuildInfoLogger from "./common/components/debug/BuildInfoLogger";

/** 휴대폰 화면을 그릴 때 그 주소의 화면: 휴대폰 화면이 있으면 그것, 없으면 PC 화면 */
function pickScreen(route: AppRouteConfig, showMobile: boolean) {
  return showMobile && route.mobile ? route.mobile : route.element;
}

function AdminLayoutOutlet() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

/**
 * 로그인한 뒤의 경로. 휴대폰 화면이 있는 주소는 MobileLayout(아래 탭은 화면이 그림),
 * 나머지는 지금처럼 AdminLayout(PC 화면) 안에 그린다.
 */
function SignedInRoutes({ showMobile }: { showMobile: boolean }) {
  const mobileRoutes = showMobile ? ADMIN_ROUTE_CONFIG.filter((r) => r.mobile) : [];
  const desktopRoutes = ADMIN_ROUTE_CONFIG.filter((r) => !(showMobile && r.mobile));
  return (
    <Routes>
      {mobileRoutes.length > 0 ? (
        <Route element={<MobileLayout />}>
          {mobileRoutes.map((route) => {
            const Screen = pickScreen(route, true);
            return <Route key={route.path} path={route.path} element={<Screen />} />;
          })}
        </Route>
      ) : null}
      <Route element={<AdminLayoutOutlet />}>
        {desktopRoutes.map((route) => {
          const Screen = route.element;
          return <Route key={route.path} path={route.path} element={<Screen />} />;
        })}
        <Route path="*" element={<Navigate to={ROUTES.ROOT} replace />} />
      </Route>
    </Routes>
  );
}

function AppRoutes() {
  const showMobile = useShowMobileScreens();
  return (
    <>
      {/* 서버 오류·실시간 알림 안내: 휴대폰 화면은 위쪽 알림 배너(AlertBannerHost), PC는 지금 모양.
          한 일 + 되돌리기는 휴대폰 화면 아래 스낵바(SnackbarHost) */}
      {showMobile ? (
        <>
          <AlertBannerHost />
          <SnackbarHost />
        </>
      ) : (
        <Alert />
      )}
      <ConfirmAlert />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* 인증 관련 경로 (AdminLayout 밖) */}
          {AUTH_ROUTE_CONFIG.map((route) => {
            const Screen = pickScreen(route, showMobile);
            return <Route key={route.path} path={route.path} element={<Screen />} />;
          })}
          <Route
            path="/*"
            element={
              <AuthInitializerProvider>
                <SignedInRoutes showMobile={showMobile} />
              </AuthInitializerProvider>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

const App: React.FC = () => {
  return (
    <ErrorBoundaryProvider>
      <QueryProvider>
        <PostHogProvider>
          <BuildInfoLogger />
          <Router>
            <PostHogPageView />
            <SellerAppBridgeProvider>
              <AppRoutes />
            </SellerAppBridgeProvider>
          </Router>
        </PostHogProvider>
      </QueryProvider>
    </ErrorBoundaryProvider>
  );
};

export default App;
