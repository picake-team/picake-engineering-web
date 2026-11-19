import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { MobileLayout } from "@/apps/web-seller/common/components/layouts/MobileLayout";
import { DesktopLayout } from "@/apps/web-seller/common/components/layouts/DesktopLayout";
import {
  ROUTES,
  AUTH_ROUTE_CONFIG,
  ADMIN_ROUTE_CONFIG,
  screenFor,
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
import BuildInfoLogger from "./common/components/debug/BuildInfoLogger";
import { ActAsBanner } from "./common/components/act-as/ActAsBanner";
import {
  ActAsBlockedScreen,
  isActAsBlockedPath,
} from "./common/components/act-as/ActAsBlockedScreen";
import { isActAsMode } from "./common/utils/act-as.util";
import { isSellerAppWebView } from "./common/utils/webview.bridge";

/**
 * 로그인한 뒤의 경로. 휴대폰 폭은 MobileLayout(아래 탭은 화면이 그림), 넓으면 DesktopLayout(왼쪽 메뉴, 기획 I-54).
 * 주소마다 그 폭의 화면을 고른다(PC 화면이 따로 없으면 같은 화면을 PC 틀 안에).
 */
function SignedInRoutes({ showMobile }: { showMobile: boolean }) {
  const { pathname } = useLocation();
  const Layout = showMobile ? MobileLayout : DesktopLayout;
  // 운영자 대신 입력 중(기획 I-41)에는 막힌 기능 화면 대신 짧은 안내(틀·메뉴는 그대로)
  if (isActAsMode() && isActAsBlockedPath(pathname)) {
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route path="*" element={<ActAsBlockedScreen />} />
        </Route>
      </Routes>
    );
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        {ADMIN_ROUTE_CONFIG.map((route) => {
          const Screen = screenFor(route, showMobile, isSellerAppWebView());
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
      {/* 서버 오류·실시간 알림 안내는 위쪽 안내 띠, 한 일 + 되돌리기는 아래 스낵바. PC도 같은 모양(기획 I-54)이고
          왼쪽 메뉴를 피해 본문 가운데에 온다. PC는 아래 탭이 없어 스낵바를 조금 낮게(채팅 쓰는 칸 위) */}
      <AlertBannerHost />
      {showMobile ? <SnackbarHost /> : <SnackbarHost bottomOffset={88} />}
      {/* 운영자 대신 입력 중(기획 I-41)인 탭만 맨 위 띠 */}
      <ActAsBanner />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* 인증 관련 경로 (휴대폰·PC 틀 밖). 앱 안에서는 폭이 넓어도(아이패드) 휴대폰 로그인·가입 —
              심사용 로그인 입구(로고 10번)·Apple 버튼·"이미 가입한 계정" 안내가 휴대폰 화면에만 있다(앱 심사) */}
          {AUTH_ROUTE_CONFIG.map((route) => {
            const Screen = screenFor(route, showMobile || isSellerAppWebView());
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
