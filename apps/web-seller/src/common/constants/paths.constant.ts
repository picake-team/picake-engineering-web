export { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";

import type { ComponentType } from "react";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { lazyPage } from "@/apps/web-seller/common/utils/lazy-page.util";
import { LoginPage } from "@/apps/web-seller/pages/auth/Login";

/**
 * 경로 하나 = 화면 하나. 같은 주소에 PC 화면(`element`)과 휴대폰 화면(`mobile`, 판매자 앱 I-48)을 둔다.
 * 휴대폰 화면이 아직 없는 주소는 휴대폰 폭에서도 PC 화면을 그린다(`SCREEN_MODE`, `useShowMobileScreens`).
 * 파일은 `Home.desktop.tsx` / `Home.mobile.tsx`처럼 화면 파일만 나눈다(프로젝트 구조 가이드 "앱 구조 원칙").
 */
export interface AppRouteConfig {
  path: string;
  element: ComponentType<object>;
  mobile?: ComponentType<object>;
}

// 로그인은 첫 진입점 — static import 유지
const FindAccountPage = lazyPage(
  () => import("@/apps/web-seller/pages/auth/FindAccount"),
  "FindAccountPage",
);
const GoogleAuthCallbackPage = lazyPage(
  () => import("@/apps/web-seller/pages/auth/GoogleAuthCallback"),
  "GoogleAuthCallbackPage",
);
const KakaoAuthCallbackPage = lazyPage(
  () => import("@/apps/web-seller/pages/auth/KakaoAuthCallback"),
  "KakaoAuthCallbackPage",
);
const TermsOfServicePage = lazyPage(
  () => import("@/apps/web-seller/pages/terms/TermsOfService"),
  "TermsOfServicePage",
);
const PrivacyPolicyPage = lazyPage(
  () => import("@/apps/web-seller/pages/terms/PrivacyPolicy"),
  "PrivacyPolicyPage",
);

const RootPage = lazyPage(() => import("@/apps/web-seller/pages/Root"), "RootPage");
const MypageIndexPage = lazyPage(
  () => import("@/apps/web-seller/pages/mypage/Index"),
  "MypageIndexPage",
);
const StoreCreatePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/Create"),
  "StoreCreatePage",
);
const StoreDetailHomePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Home"),
  "StoreDetailHomePage",
);
const StoreDetailProductListPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/products/List"),
  "StoreDetailProductListPage",
);
const StoreDetailProductCreatePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/products/Create"),
  "StoreDetailProductCreatePage",
);
const StoreDetailProductDetailPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/products/Detail"),
  "StoreDetailProductDetailPage",
);
const StoreDetailEditPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Edit"),
  "StoreDetailEditPage",
);
const StoreDetailCalendarPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Calendar"),
  "StoreDetailCalendarPage",
);
const StoreDetailFeedListPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/feed/List"),
  "StoreDetailFeedListPage",
);
const StoreDetailFeedCreatePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/feed/Create"),
  "StoreDetailFeedCreatePage",
);
const StoreDetailFeedDetailPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/feed/Detail"),
  "StoreDetailFeedDetailPage",
);
const StoreDetailOrderListPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/orders/List"),
  "StoreDetailOrderListPage",
);
const StoreDetailOrderDetailPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/orders/Detail"),
  "StoreDetailOrderDetailPage",
);
const StoreDetailNotificationsListPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/notifications/List"),
  "StoreDetailNotificationsListPage",
);
const StoreDetailNotificationsSettingsPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/notifications/Settings"),
  "StoreDetailNotificationsSettingsPage",
);
const StoreDetailStatisticsPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/statistics/Index"),
  "StoreDetailStatisticsPage",
);

// 인증 관련 경로 (AdminLayout 밖)
export const AUTH_ROUTE_CONFIG: AppRouteConfig[] = [
  { path: ROUTES.AUTH.LOGIN, element: LoginPage },
  { path: ROUTES.AUTH.FIND_ACCOUNT, element: FindAccountPage },
  { path: ROUTES.AUTH.GOOGLE_REDIRECT_URI, element: GoogleAuthCallbackPage },
  { path: ROUTES.AUTH.KAKAO_REDIRECT_URI, element: KakaoAuthCallbackPage },
  { path: ROUTES.TERMS.TERMS_OF_SERVICE, element: TermsOfServicePage },
  { path: ROUTES.TERMS.PRIVACY_POLICY, element: PrivacyPolicyPage },
];

// 로그인한 뒤의 경로 (PC: AdminLayout 안, 휴대폰: MobileLayout 안)
export const ADMIN_ROUTE_CONFIG: AppRouteConfig[] = [
  { path: ROUTES.ROOT, element: RootPage },
  { path: ROUTES.MYPAGE, element: MypageIndexPage },
  // 스토어 관련 경로
  { path: ROUTES.STORE_CREATE, element: StoreCreatePage },
  { path: ROUTES.STORE_DETAIL_HOME(":storeId"), element: StoreDetailHomePage },
  { path: ROUTES.STORE_DETAIL_PRODUCTS(":storeId"), element: StoreDetailProductListPage },
  { path: ROUTES.STORE_DETAIL_PRODUCTS_LIST(":storeId"), element: StoreDetailProductListPage },
  { path: ROUTES.STORE_DETAIL_PRODUCTS_CREATE(":storeId"), element: StoreDetailProductCreatePage },
  {
    path: ROUTES.STORE_DETAIL_PRODUCTS_DETAIL(":storeId", ":productId"),
    element: StoreDetailProductDetailPage,
  },
  { path: ROUTES.STORE_DETAIL_FEED_LIST(":storeId"), element: StoreDetailFeedListPage },
  { path: ROUTES.STORE_DETAIL_FEED_CREATE(":storeId"), element: StoreDetailFeedCreatePage },
  {
    path: ROUTES.STORE_DETAIL_FEED_DETAIL(":storeId", ":feedId"),
    element: StoreDetailFeedDetailPage,
  },
  { path: ROUTES.STORE_DETAIL_ORDERS_LIST(":storeId"), element: StoreDetailOrderListPage },
  {
    path: ROUTES.STORE_DETAIL_ORDERS_DETAIL(":storeId", ":orderId"),
    element: StoreDetailOrderDetailPage,
  },
  {
    path: ROUTES.STORE_DETAIL_STATISTICS_ORDERS(":storeId"),
    element: StoreDetailStatisticsPage,
  },
  {
    path: ROUTES.STORE_DETAIL_NOTIFICATIONS_LIST(":storeId"),
    element: StoreDetailNotificationsListPage,
  },
  {
    path: ROUTES.STORE_DETAIL_NOTIFICATIONS_SETTINGS(":storeId"),
    element: StoreDetailNotificationsSettingsPage,
  },
  { path: ROUTES.STORE_DETAIL_EDIT(":storeId"), element: StoreDetailEditPage },
  { path: ROUTES.STORE_DETAIL_CALENDAR(":storeId"), element: StoreDetailCalendarPage },
];
