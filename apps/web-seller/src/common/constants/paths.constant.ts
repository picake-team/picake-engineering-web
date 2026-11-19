export { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";

import type { ComponentType } from "react";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { lazyPage } from "@/apps/web-seller/common/utils/lazy-page.util";
import { LoginPage } from "@/apps/web-seller/pages/auth/Login";

/**
 * 경로 하나 = 화면 하나. 같은 주소에 휴대폰 화면(`mobile`)과 PC 화면(`desktop`)을 둔다(기획 I-48·I-54).
 *
 * - 휴대폰 폭(767까지)은 `mobile`, 넓으면 `desktop`을 그린다(`useShowMobileScreens`).
 * - `desktop`은 꼭 적는다: PC 화면을 따로 만들었으면 그 화면, 같은 화면을 PC 틀 안에 쓰면 `SAME_SCREEN`.
 *   빈칸이 없어서 PC에 화면이 빠질 수 없다("PC ≥ 휴대폰", 운영자 결정 2026-11-19). `paths.constant.test.ts`가 확인한다.
 * - PC 화면을 따로 만드는 곳은 무엇을 함께 보여 주는지가 다른 곳만(홈·주문·캘린더·상품 목록·채팅). 나머지는 같은 화면.
 * - 파일은 `Home.desktop.tsx` / `Home.mobile.tsx`처럼 화면 파일만 나눈다(프로젝트 구조 가이드 "앱 구조 원칙").
 */
export const SAME_SCREEN = "same-screen" as const;

export interface AppRouteConfig {
  path: string;
  mobile: ComponentType<object>;
  desktop: ComponentType<object> | typeof SAME_SCREEN;
  /** 한쪽에서만 뜻이 있는 화면의 이유(예: "앱에서만: 처음 사용 안내"). 테스트가 목록을 확인한다 */
  onlyOn?: { surface: "mobile" | "desktop"; reason: string };
}

/**
 * 그 폭에서 그릴 화면.
 * 앱 안(inApp)에서는 폭이 넓어도(아이패드 — iOS 앱은 아이패드에서도 돈다) 휴대폰에만 뜻이 있는 화면(onlyOn mobile,
 * 예: 처음 사용 안내·알림 허용)을 휴대폰 화면으로 그린다.
 */
export function screenFor(
  route: AppRouteConfig,
  phone: boolean,
  inApp = false,
): ComponentType<object> {
  if (phone || route.desktop === SAME_SCREEN) return route.mobile;
  if (inApp && route.onlyOn?.surface === "mobile") return route.mobile;
  return route.desktop;
}

// ---------- 인증·약관(로그인 확인 밖) ----------
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
// 네이버 PC 콜백은 카카오와 같은 화면(번호 칸 + 다른 번호)
const NaverAuthCallbackPage = lazyPage(
  () => import("@/apps/web-seller/pages/auth/KakaoAuthCallback"),
  "NaverAuthCallbackPage",
);
const TermsOfServicePage = lazyPage(
  () => import("@/apps/web-seller/pages/terms/TermsOfService"),
  "TermsOfServicePage",
);
const PrivacyPolicyPage = lazyPage(
  () => import("@/apps/web-seller/pages/terms/PrivacyPolicy"),
  "PrivacyPolicyPage",
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
const NaverAuthCallbackMobilePage = lazyPage(oauthMobile, "NaverAuthCallbackMobilePage");
const ActAsEntryPage = lazyPage(
  () => import("@/apps/web-seller/pages/act-as/ActAs"),
  "ActAsEntryPage",
);
const ActAsEndedPage = lazyPage(
  () => import("@/apps/web-seller/pages/act-as/ActAs"),
  "ActAsEndedPage",
);

// ---------- 휴대폰 화면(판매자 앱 I-48). PC도 같은 화면을 PC 틀 안에 쓰는 곳이 많다 ----------
const RootMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/Root.mobile"),
  "RootMobilePage",
);
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
const StoreDetailMenuMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Menu.mobile"),
  "StoreDetailMenuMobilePage",
);
const StoreSettingsMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Settings.mobile"),
  "StoreSettingsMobilePage",
);
const chatsMobile = () => import("@/apps/web-seller/pages/store/detail/chats/Chats.mobile");
const StoreDetailChatsMobilePage = lazyPage(chatsMobile, "StoreDetailChatsMobilePage");
const StoreDetailChatRoomMobilePage = lazyPage(chatsMobile, "StoreDetailChatRoomMobilePage");
const StoreDetailChatOrderMobilePage = lazyPage(chatsMobile, "StoreDetailChatOrderMobilePage");
const StoreDetailCalendarMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Calendar.mobile"),
  "StoreDetailCalendarMobilePage",
);
const manualForm = () => import("@/apps/web-seller/pages/store/detail/manual-orders/Form.mobile");
const StoreDetailManualOrderCreateMobilePage = lazyPage(
  manualForm,
  "StoreDetailManualOrderCreateMobilePage",
);
const StoreDetailManualOrderEditMobilePage = lazyPage(
  manualForm,
  "StoreDetailManualOrderEditMobilePage",
);
const StoreDetailManualOrderDetailMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/manual-orders/Detail.mobile"),
  "StoreDetailManualOrderDetailMobilePage",
);
const StoreDetailHoursMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Hours.mobile"),
  "StoreDetailHoursMobilePage",
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
const StoreCreateMobilePage = lazyPage(framed, "StoreCreateMobilePage");
const StoreWelcomeMobilePage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Welcome.mobile"),
  "StoreWelcomeMobilePage",
);

// ---------- PC 화면을 따로 만든 곳(기획 I-54) ----------
const StoreDetailHomeDesktopPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Home.desktop"),
  "StoreDetailHomeDesktopPage",
);
const ordersDesktop = () => import("@/apps/web-seller/pages/store/detail/orders/Orders.desktop");
const StoreDetailOrdersDesktopPage = lazyPage(ordersDesktop, "StoreDetailOrdersDesktopPage");
const StoreDetailProductListDesktopPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/products/List.desktop"),
  "StoreDetailProductListDesktopPage",
);
const StoreDetailCalendarDesktopPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Calendar.desktop"),
  "StoreDetailCalendarDesktopPage",
);
const chatsDesktop = () => import("@/apps/web-seller/pages/store/detail/chats/Chats.desktop");
const StoreDetailChatsDesktopPage = lazyPage(chatsDesktop, "StoreDetailChatsDesktopPage");
const StoreWelcomeDesktopPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/Welcome.desktop"),
  "StoreWelcomeDesktopPage",
);
const StoreDetailPrintOrdersPage = lazyPage(
  () => import("@/apps/web-seller/pages/store/detail/print/Orders"),
  "StoreDetailPrintOrdersPage",
);

// 인증 관련 경로 (로그인 확인 밖). PC 로그인은 가운데 카드(사업자 정보 포함)라 따로 둔다
export const AUTH_ROUTE_CONFIG: AppRouteConfig[] = [
  { path: ROUTES.AUTH.LOGIN, mobile: LoginMobilePage, desktop: LoginPage },
  { path: ROUTES.AUTH.FIND_ACCOUNT, mobile: FindAccountMobilePage, desktop: FindAccountPage },
  {
    path: ROUTES.AUTH.GOOGLE_REDIRECT_URI,
    mobile: GoogleAuthCallbackMobilePage,
    desktop: GoogleAuthCallbackPage,
  },
  {
    path: ROUTES.AUTH.KAKAO_REDIRECT_URI,
    mobile: KakaoAuthCallbackMobilePage,
    desktop: KakaoAuthCallbackPage,
  },
  {
    path: ROUTES.AUTH.NAVER_REDIRECT_URI,
    mobile: NaverAuthCallbackMobilePage,
    desktop: NaverAuthCallbackPage,
  },
  { path: ROUTES.TERMS.TERMS_OF_SERVICE, mobile: TermsOfServicePage, desktop: SAME_SCREEN },
  { path: ROUTES.TERMS.PRIVACY_POLICY, mobile: PrivacyPolicyPage, desktop: SAME_SCREEN },
  // 운영자 대신 입력(기획 I-41): 출입증을 받기 전이라 로그인 확인 밖에 둔다
  { path: ROUTES.ACT_AS, mobile: ActAsEntryPage, desktop: SAME_SCREEN },
  { path: ROUTES.ACT_AS_ENDED, mobile: ActAsEndedPage, desktop: SAME_SCREEN },
];

// 로그인한 뒤의 경로 (휴대폰: MobileLayout 안, PC: DesktopLayout 안)
export const ADMIN_ROUTE_CONFIG: AppRouteConfig[] = [
  { path: ROUTES.ROOT, mobile: RootMobilePage, desktop: SAME_SCREEN },
  { path: ROUTES.MYPAGE, mobile: MypageIndexMobilePage, desktop: SAME_SCREEN },
  { path: ROUTES.MYPAGE_PHONE, mobile: MypagePhoneMobilePage, desktop: SAME_SCREEN },
  { path: ROUTES.MYPAGE_WITHDRAW, mobile: MypageWithdrawMobilePage, desktop: SAME_SCREEN },
  { path: ROUTES.STORE_CREATE, mobile: StoreCreateMobilePage, desktop: SAME_SCREEN },
  {
    path: ROUTES.STORE_DETAIL_HOME(":storeId"),
    mobile: StoreDetailHomeMobilePage,
    desktop: StoreDetailHomeDesktopPage,
  },
  {
    path: ROUTES.STORE_DETAIL_PRODUCTS(":storeId"),
    mobile: StoreDetailProductListMobilePage,
    desktop: StoreDetailProductListDesktopPage,
  },
  {
    path: ROUTES.STORE_DETAIL_PRODUCTS_LIST(":storeId"),
    mobile: StoreDetailProductListMobilePage,
    desktop: StoreDetailProductListDesktopPage,
  },
  {
    path: ROUTES.STORE_DETAIL_PRODUCTS_CREATE(":storeId"),
    mobile: StoreDetailProductCreateMobilePage,
    desktop: SAME_SCREEN,
  },
  {
    path: ROUTES.STORE_DETAIL_PRODUCTS_DETAIL(":storeId", ":productId"),
    mobile: StoreDetailProductDetailMobilePage,
    desktop: SAME_SCREEN,
  },
  {
    path: ROUTES.STORE_DETAIL_FEED_LIST(":storeId"),
    mobile: StoreDetailFeedListMobilePage,
    desktop: SAME_SCREEN,
  },
  {
    path: ROUTES.STORE_DETAIL_FEED_CREATE(":storeId"),
    mobile: StoreDetailFeedCreateMobilePage,
    desktop: SAME_SCREEN,
  },
  {
    path: ROUTES.STORE_DETAIL_FEED_DETAIL(":storeId", ":feedId"),
    mobile: StoreDetailFeedDetailMobilePage,
    desktop: SAME_SCREEN,
  },
  {
    path: ROUTES.STORE_DETAIL_ORDERS_LIST(":storeId"),
    mobile: StoreDetailOrderListMobilePage,
    desktop: StoreDetailOrdersDesktopPage,
  },
  {
    path: ROUTES.STORE_DETAIL_ORDERS_DETAIL(":storeId", ":orderId"),
    mobile: StoreDetailOrderDetailMobilePage,
    desktop: StoreDetailOrdersDesktopPage,
  },
  {
    path: ROUTES.STORE_DETAIL_STATISTICS_ORDERS(":storeId"),
    mobile: StoreDetailStatisticsMobilePage,
    desktop: SAME_SCREEN,
  },
  {
    path: ROUTES.STORE_DETAIL_CHATS(":storeId"),
    mobile: StoreDetailChatsMobilePage,
    desktop: StoreDetailChatsDesktopPage,
  },
  {
    path: ROUTES.STORE_DETAIL_CHAT_ORDER(":storeId", ":orderId"),
    mobile: StoreDetailChatOrderMobilePage,
    desktop: StoreDetailChatsDesktopPage,
  },
  {
    path: ROUTES.STORE_DETAIL_CHAT_ROOM(":storeId", ":threadId"),
    mobile: StoreDetailChatRoomMobilePage,
    desktop: StoreDetailChatsDesktopPage,
  },
  {
    path: ROUTES.STORE_DETAIL_NOTIFICATIONS_LIST(":storeId"),
    mobile: StoreDetailNotificationsListMobilePage,
    desktop: SAME_SCREEN,
  },
  {
    path: ROUTES.STORE_DETAIL_NOTIFICATIONS_SETTINGS(":storeId"),
    mobile: StoreDetailNotificationSettingsMobilePage,
    desktop: SAME_SCREEN,
  },
  {
    path: ROUTES.STORE_DETAIL_EDIT(":storeId"),
    mobile: StoreDetailEditMobilePage,
    desktop: SAME_SCREEN,
  },
  {
    path: ROUTES.STORE_DETAIL_CALENDAR(":storeId"),
    mobile: StoreDetailCalendarMobilePage,
    desktop: StoreDetailCalendarDesktopPage,
  },
  // 직접 적은 주문(기획 I-42)
  {
    path: ROUTES.STORE_DETAIL_MANUAL_ORDER_CREATE(":storeId"),
    mobile: StoreDetailManualOrderCreateMobilePage,
    desktop: SAME_SCREEN,
  },
  {
    path: ROUTES.STORE_DETAIL_MANUAL_ORDER_EDIT(":storeId", ":manualOrderId"),
    mobile: StoreDetailManualOrderEditMobilePage,
    desktop: SAME_SCREEN,
  },
  {
    path: ROUTES.STORE_DETAIL_MANUAL_ORDER_DETAIL(":storeId", ":manualOrderId"),
    mobile: StoreDetailManualOrderDetailMobilePage,
    desktop: SAME_SCREEN,
  },
  {
    path: ROUTES.STORE_DETAIL_HOURS(":storeId"),
    mobile: StoreDetailHoursMobilePage,
    desktop: SAME_SCREEN,
  },
  {
    path: ROUTES.STORE_DETAIL_MENU(":storeId"),
    mobile: StoreDetailMenuMobilePage,
    desktop: SAME_SCREEN,
  },
  {
    path: ROUTES.STORE_DETAIL_SETTINGS(":storeId"),
    mobile: StoreSettingsMobilePage,
    desktop: SAME_SCREEN,
  },
  {
    path: ROUTES.STORE_DETAIL_WELCOME(":storeId"),
    mobile: StoreWelcomeMobilePage,
    desktop: StoreWelcomeDesktopPage,
    onlyOn: {
      surface: "mobile",
      reason: "앱에서만: 처음 사용 안내(알림 켜기). PC는 스토어 홈으로",
    },
  },
  {
    path: ROUTES.STORE_DETAIL_PRINT_ORDERS(":storeId"),
    mobile: StoreDetailPrintOrdersPage,
    desktop: SAME_SCREEN,
    onlyOn: {
      surface: "desktop",
      reason: "PC에만: 그날 주문서 묶음 인쇄(휴대폰에는 들어가는 버튼이 없다)",
    },
  },
];
