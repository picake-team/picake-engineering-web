"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Header from "@/apps/web-user/common/components/headers/Header";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { Alert } from "@/apps/web-user/common/components/alerts/Alert";
import BuildInfoLogger from "@/apps/web-user/common/components/debug/BuildInfoLogger";
import { AuthProvider } from "@/apps/web-user/common/components/providers/AuthProvider";
import { AlarmRealtimeListener } from "@/apps/web-user/features/alarm/components/AlarmRealtimeListener";
import { LoginBottomSheet } from "@/apps/web-user/features/auth/components/LoginBottomSheet";
import { useAuthHasHydrated, useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { isWebViewEnvironment } from "@/apps/web-user/common/utils/webview.bridge";

const PaymentPendingLaunchSheet = dynamic(
  () =>
    import("@/apps/web-user/features/order/components/PaymentPendingLaunchSheet").then(
      (module) => module.PaymentPendingLaunchSheet,
    ),
  { ssr: false },
);

interface RootWrapperLayoutProps {
  children: ReactNode;
}

/** 로그인 + 웹뷰 환경에서만 결제 대기 시트(및 useMyOrders)를 로드합니다. */
function PaymentPendingLaunchSheetGate() {
  const hasHydrated = useAuthHasHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!hasHydrated || !isAuthenticated || !isWebViewEnvironment()) {
    return null;
  }

  return <PaymentPendingLaunchSheet />;
}

export default function RootWrapperLayout({ children }: RootWrapperLayoutProps) {
  const pathname = usePathname();

  // pathname에 따라 헤더 설정 결정
  const getHeaderConfig = (): {
    variant: "main" | "product" | "minimal" | "search" | "back-title";
    title?: string;
    backFallbackPath?: string;
  } => {
    if (pathname === "/") return { variant: "main" };
    if (pathname === "/search") return { variant: "search" };
    if (pathname === "/map" || pathname === "/map/search") return { variant: "minimal" };
    if (pathname?.startsWith("/chat")) return { variant: "minimal" };
    if (pathname?.startsWith("/reservation")) return { variant: "minimal" };
    if (pathname === "/alarm") return { variant: "back-title", title: "알림" };
    if (pathname === "/mypage/setting")
      return { variant: "back-title", title: "설정", backFallbackPath: PATHS.MYPAGE };
    if (pathname === "/mypage/setting/account")
      return { variant: "back-title", title: "내 계정 정보", backFallbackPath: PATHS.MYPAGE };
    if (pathname === "/mypage/setting/notification")
      return { variant: "back-title", title: "알림 설정", backFallbackPath: PATHS.MYPAGE };
    if (pathname === "/qa") return { variant: "minimal" };
    // 앱 다운로드 진입점(/app) 하위는 QR로 직진입하는 단독 화면이라 공통 헤더 없음
    if (pathname?.startsWith("/app/")) return { variant: "minimal" };
    // 입점 안내(/partner)도 QR로 직진입하는 단독 화면
    if (pathname === PATHS.PARTNER || pathname?.startsWith(`${PATHS.PARTNER}/`))
      return { variant: "minimal" };
    // 로그인/회원가입 화면(콜백 포함)은 자체 레이아웃을 쓰므로 공통 헤더 없음
    if (pathname?.startsWith("/auth/")) return { variant: "minimal" };
    if (pathname?.startsWith("/mypage/")) return { variant: "minimal" };
    if (pathname?.startsWith("/order/")) return { variant: "minimal" };
    // 견적 요청(요청서·보낸 뒤·요청 상세)은 자체 머리줄을 쓴다
    if (pathname?.startsWith("/quote/")) return { variant: "minimal" };
    if (pathname === "/mypage") return { variant: "minimal" };
    if (pathname === "/saved") return { variant: "minimal" };
    // 케이크 디자인 상세(기획 I-112)
    if (pathname?.startsWith("/design/"))
      return { variant: "back-title", title: "케이크 디자인", backFallbackPath: PATHS.HOME };
    if (pathname?.startsWith("/product/")) return { variant: "product" };
    if (pathname?.startsWith("/store/")) return { variant: "product" };
    return { variant: "main" };
  };

  const { variant: headerVariant, title: headerTitle, backFallbackPath } = getHeaderConfig();

  // 사장님 견적 링크(가입 없이, 기획 I-46 SC-19)는 손님 앱이 아니라서 머리줄·알림·위치 묻기·로그인 창·
  // 입금 안내를 띄우지 않는다(이 기기에 남은 손님 로그인이 끝났으면 "로그인" 창이 뜨던 것, 11-12 로컬 확인)
  if (pathname?.startsWith("/q/")) {
    return (
      <div
        id="root-scroll-container"
        className="w-full sm:w-[640px] h-screen mx-auto sm:border-x border-gray-200 overflow-y-auto overflow-x-hidden scrollbar-hide"
      >
        {children}
      </div>
    );
  }

  return (
    <AuthProvider>
      <BuildInfoLogger />
      <AlarmRealtimeListener />
      <div
        id="root-scroll-container"
        className="w-full sm:w-[640px] h-screen mx-auto sm:border-x border-gray-200 overflow-y-auto overflow-x-hidden scrollbar-hide"
      >
        <Header variant={headerVariant} title={headerTitle} backFallbackPath={backFallbackPath} />
        <div>{children}</div>
        <Alert />
        <LoginBottomSheet />
        <PaymentPendingLaunchSheetGate />
      </div>
    </AuthProvider>
  );
}
