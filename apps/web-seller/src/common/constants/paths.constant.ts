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
  () => import("@/apps/web-seller/pages/mypage/Index.desktop"),
  "MypageIndexPage",
);
const StoreCreatePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/Create"),
  "StoreCreatePage",
);
const StoreDetailHomePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Home.desktop"),
  "StoreDetailHomePage",
);
const StoreDetailProductListPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/products/List.desktop"),
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
  () => import("@/apps/web-seller/pages/store/detail/Calendar.desktop"),
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
// 휴대폰 화면(판매자 앱 I-48). 같은 주소의 PC 화면 옆에 둔다
const StoreDetailHomeMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Home.mobile"),
  "StoreDetailHomeMobilePage",
);
const StoreDetailOrderListMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/orders/List.mobile"),
  "StoreDetailOrderListMobilePage",
);
const StoreDetailOrderDetailMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/orders/Detail.mobile"),
  "StoreDetailOrderDetailMobilePage",
);
const StoreDetailNotificationsListMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/notifications/List.mobile"),
  "StoreDetailNotificationsListMobilePage",
);
const StoreDetailMenuPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Menu.desktop"),
  "StoreDetailMenuPage",
);
const StoreDetailMenuMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Menu.mobile"),
  "StoreDetailMenuMobilePage",
);
const StoreDetailCalendarMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Calendar.mobile"),
  "StoreDetailCalendarMobilePage",
);
const StoreDetailCalendarDayMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/CalendarDay.mobile"),
  "StoreDetailCalendarDayMobilePage",
);
const StoreDetailHoursMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Hours.mobile"),
  "StoreDetailHoursMobilePage",
);
const StoreDetailCalendarSubPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/CalendarSub.desktop"),
  "StoreDetailCalendarSubPage",
);
const StoreDetailStatisticsMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/statistics/Index.mobile"),
  "StoreDetailStatisticsMobilePage",
);
const StoreDetailNotificationSettingsMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/notifications/Settings.mobile"),
  "StoreDetailNotificationSettingsMobilePage",
);
const MypageIndexMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/mypage/Index.mobile"),
  "MypageIndexMobilePage",
);
const MypagePhoneMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/mypage/Phone.mobile"),
  "MypagePhoneMobilePage",
);
const MypageWithdrawMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/mypage/Withdraw.mobile"),
  "MypageWithdrawMobilePage",
);
const MypageSubPage = lazyPage(
  () => import("@/apps/web-seller/pages/mypage/Sub.desktop"),
  "MypageSubPage",
);
const StoreDetailProductListMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/products/List.mobile"),
  "StoreDetailProductListMobilePage",
);
const framed = () => import("@/apps/web-seller/pages/store/detail/Framed.mobile");
const StoreDetailProductCreateMobilePage = lazyPage(framed, "StoreDetailProductCreateMobilePage");
const StoreDetailProductDetailMobilePage = lazyPage(framed, "StoreDetailProductDetailMobilePage");
const StoreDetailFeedListMobilePage = lazyPage(framed, "StoreDetailFeedListMobilePage");
const StoreDetailFeedCreateMobilePage = lazyPage(framed, "StoreDetailFeedCreateMobilePage");
const StoreDetailFeedDetailMobilePage = lazyPage(framed, "StoreDetailFeedDetailMobilePage");
const StoreDetailEditMobilePage = lazyPage(framed, "StoreDetailEditMobilePage");
const StoreWelcomeMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Welcome.mobile"),
  "StoreWelcomeMobilePage",
);
const StoreDetailOrderListPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/orders/List.desktop"),
  "StoreDetailOrderListPage",
);
const StoreDetailOrderDetailPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/orders/Detail.desktop"),
  "StoreDetailOrderDetailPage",
);
const StoreDetailNotificationsListPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/notifications/List.desktop"),
  "StoreDetailNotificationsListPage",
);
const StoreDetailNotificationsSettingsPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/notifications/Settings.desktop"),
  "StoreDetailNotificationsSettingsPage",
);
const StoreDetailStatisticsPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/statistics/Index.desktop"),
  "StoreDetailStatisticsPage",
);

const LoginMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/auth/Login.mobile"),
  "LoginMobilePage",
);
const FindAccountMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/auth/FindAccount.mobile"),
  "FindAccountMobilePage",
);
const oauthMobile = () => import("@/apps/web-seller/pages/auth/OAuthCallback.mobile");
const GoogleAuthCallbackMobilePage = lazyPage(oauthMobile, "GoogleAuthCallbackMobilePage");
const KakaoAuthCallbackMobilePage = lazyPage(oauthMobile, "KakaoAuthCallbackMobilePage");
const RootMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/Root.mobile"),
  "RootMobilePage",
);
const StoreCreateMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Framed.mobile"),
  "StoreCreateMobilePage",
);

// 인증 관련 경로 (AdminLayout 밖)
export const AUTH_ROUTE_CONFIG: AppRouteConfig[] = [
  { path: ROUTES.AUTH.LOGIN, element: LoginPage, mobile: LoginMobilePage },
  { path: ROUTES.AUTH.FIND_ACCOUNT, element: FindAccountPage, mobile: FindAccountMobilePage },
  {
    path: ROUTES.AUTH.GOOGLE_REDIRECT_URI,
    element: GoogleAuthCallbackPage,
    mobile: GoogleAuthCallbackMobilePage,
  },
  {
    path: ROUTES.AUTH.KAKAO_REDIRECT_URI,
    element: KakaoAuthCallbackPage,
    mobile: KakaoAuthCallbackMobilePage,
  },
  { path: ROUTES.TERMS.TERMS_OF_SERVICE, element: TermsOfServicePage },
  { path: ROUTES.TERMS.PRIVACY_POLICY, element: PrivacyPolicyPage },
];

// 로그인한 뒤의 경로 (PC: AdminLayout 안, 휴대폰: MobileLayout 안)
export const ADMIN_ROUTE_CONFIG: AppRouteConfig[] = [
  { path: ROUTES.ROOT, element: RootPage, mobile: RootMobilePage },
  { path: ROUTES.MYPAGE, element: MypageIndexPage, mobile: MypageIndexMobilePage },
  { path: ROUTES.MYPAGE_PHONE, element: MypageSubPage, mobile: MypagePhoneMobilePage },
  { path: ROUTES.MYPAGE_WITHDRAW, element: MypageSubPage, mobile: MypageWithdrawMobilePage },
  // 스토어 관련 경로
  { path: ROUTES.STORE_CREATE, element: StoreCreatePage, mobile: StoreCreateMobilePage },
  {
    path: ROUTES.STORE_DETAIL_HOME(":storeId"),
    element: StoreDetailHomePage,
    mobile: StoreDetailHomeMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_PRODUCTS(":storeId"),
    element: StoreDetailProductListPage,
    mobile: StoreDetailProductListMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_PRODUCTS_LIST(":storeId"),
    element: StoreDetailProductListPage,
    mobile: StoreDetailProductListMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_PRODUCTS_CREATE(":storeId"),
    element: StoreDetailProductCreatePage,
    mobile: StoreDetailProductCreateMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_PRODUCTS_DETAIL(":storeId", ":productId"),
    element: StoreDetailProductDetailPage,
    mobile: StoreDetailProductDetailMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_FEED_LIST(":storeId"),
    element: StoreDetailFeedListPage,
    mobile: StoreDetailFeedListMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_FEED_CREATE(":storeId"),
    element: StoreDetailFeedCreatePage,
    mobile: StoreDetailFeedCreateMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_FEED_DETAIL(":storeId", ":feedId"),
    element: StoreDetailFeedDetailPage,
    mobile: StoreDetailFeedDetailMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_ORDERS_LIST(":storeId"),
    element: StoreDetailOrderListPage,
    mobile: StoreDetailOrderListMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_ORDERS_DETAIL(":storeId", ":orderId"),
    element: StoreDetailOrderDetailPage,
    mobile: StoreDetailOrderDetailMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_STATISTICS_ORDERS(":storeId"),
    element: StoreDetailStatisticsPage,
    mobile: StoreDetailStatisticsMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_NOTIFICATIONS_LIST(":storeId"),
    element: StoreDetailNotificationsListPage,
    mobile: StoreDetailNotificationsListMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_NOTIFICATIONS_SETTINGS(":storeId"),
    element: StoreDetailNotificationsSettingsPage,
    mobile: StoreDetailNotificationSettingsMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_EDIT(":storeId"),
    element: StoreDetailEditPage,
    mobile: StoreDetailEditMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_CALENDAR(":storeId"),
    element: StoreDetailCalendarPage,
    mobile: StoreDetailCalendarMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_CALENDAR_DAY(":storeId", ":dateKey"),
    element: StoreDetailCalendarSubPage,
    mobile: StoreDetailCalendarDayMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_HOURS(":storeId"),
    element: StoreDetailCalendarSubPage,
    mobile: StoreDetailHoursMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_MENU(":storeId"),
    element: StoreDetailMenuPage,
    mobile: StoreDetailMenuMobilePage,
  },
  {
    path: ROUTES.STORE_DETAIL_WELCOME(":storeId"),
    element: StoreDetailMenuPage,
    mobile: StoreWelcomeMobilePage,
  },
];
