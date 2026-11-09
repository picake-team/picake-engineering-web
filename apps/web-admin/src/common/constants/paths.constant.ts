import { LoginPage } from "@/apps/web-admin/pages/auth/Login";
import { RegisterPage } from "@/apps/web-admin/pages/auth/Register";
import { TotpSetupPage } from "@/apps/web-admin/pages/auth/TotpSetup";
import { TotpVerifyPage } from "@/apps/web-admin/pages/auth/TotpVerify";
import { RootPage } from "@/apps/web-admin/pages/Root";
import { StatisticsUsersPage } from "@/apps/web-admin/pages/statistics/users/Index";
import { StatisticsOrdersPage } from "@/apps/web-admin/pages/statistics/orders/Index";
import { StatisticsStoresPage } from "@/apps/web-admin/pages/statistics/stores/Index";
import { StatisticsStoreEntryRequestsPage } from "@/apps/web-admin/pages/statistics/store-entry-requests/Index";
import { ConsumerMembersListPage } from "@/apps/web-admin/pages/consumer/members/List";
import { RefundCandidatesListPage } from "@/apps/web-admin/pages/consumer/refund-candidates/List";
import { QuoteRequestsListPage } from "@/apps/web-admin/pages/consumer/quote-requests/List";
import { QuoteRequestDetailPage } from "@/apps/web-admin/pages/consumer/quote-requests/Detail";
import { SellerMembersListPage } from "@/apps/web-admin/pages/seller/members/List";
import { SellerStoresListPage } from "@/apps/web-admin/pages/seller/stores/List";
import { SellerSegmentsListPage } from "@/apps/web-admin/pages/seller/segments/List";
import { AdminRequestsListPage } from "@/apps/web-admin/pages/admin-management/requests/List";
import { AdminAccountsListPage } from "@/apps/web-admin/pages/admin-management/accounts/List";
import { AdminSettingsPage } from "@/apps/web-admin/pages/admin-management/settings/Index";
import { HomeBannersListPage } from "@/apps/web-admin/pages/consumer/home-banners/List";
import { ConsumerTermsListPage } from "@/apps/web-admin/pages/consumer/terms/List";
import { SellerTermsListPage } from "@/apps/web-admin/pages/seller/terms/List";
import { NoticesListPage } from "@/apps/web-admin/pages/consumer/notices/List";
import { QnasListPage } from "@/apps/web-admin/pages/consumer/qnas/List";

export const ROUTES = {
  ROOT: "/",
  // 통계
  STATISTICS: {
    USERS: "/statistics/users",
    ORDERS: "/statistics/orders",
    STORES: "/statistics/stores",
    STORE_ENTRY_REQUESTS: "/statistics/store-entry-requests",
  },
  // 인증 관련 경로
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    TOTP_SETUP: "/auth/totp/setup",
    TOTP_VERIFY: "/auth/totp/verify",
  },
  // 관리자 계정 관리
  ADMIN_MANAGEMENT: {
    REQUESTS: "/admin-management/requests",
    ACCOUNTS: "/admin-management/accounts",
    SETTINGS: "/admin-management/settings",
  },
  CONSUMER: {
    HOME_BANNERS: "/consumer/home-banners",
    TERMS: "/consumer/terms",
    NOTICES: "/consumer/notices",
    QNAS: "/consumer/qnas",
    MEMBERS: "/consumer/members",
    REFUND_CANDIDATES: "/consumer/refund-candidates",
    QUOTE_REQUESTS: "/consumer/quote-requests",
    QUOTE_REQUEST_DETAIL: (requestId: string) => `/consumer/quote-requests/${requestId}`,
  },
  SELLER: {
    TERMS: "/seller/terms",
    MEMBERS: "/seller/members",
    STORES: "/seller/stores",
    SEGMENTS: "/seller/segments",
  },
} as const;

// 인증 관련 경로 (AdminLayout 밖)
export const AUTH_ROUTE_CONFIG = [
  { path: ROUTES.AUTH.LOGIN, element: LoginPage },
  { path: ROUTES.AUTH.REGISTER, element: RegisterPage },
  { path: ROUTES.AUTH.TOTP_VERIFY, element: TotpVerifyPage },
  { path: ROUTES.AUTH.TOTP_SETUP, element: TotpSetupPage },
] as const;

// 관리자 관련 경로 (AdminLayout 안)
export const ADMIN_ROUTE_CONFIG = [
  { path: ROUTES.ROOT, element: RootPage },
  // 통계
  { path: ROUTES.STATISTICS.USERS, element: StatisticsUsersPage },
  { path: ROUTES.STATISTICS.ORDERS, element: StatisticsOrdersPage },
  { path: ROUTES.STATISTICS.STORES, element: StatisticsStoresPage },
  { path: ROUTES.STATISTICS.STORE_ENTRY_REQUESTS, element: StatisticsStoreEntryRequestsPage },
  // 관리자 계정 관리
  { path: ROUTES.ADMIN_MANAGEMENT.REQUESTS, element: AdminRequestsListPage },
  { path: ROUTES.ADMIN_MANAGEMENT.ACCOUNTS, element: AdminAccountsListPage },
  { path: ROUTES.ADMIN_MANAGEMENT.SETTINGS, element: AdminSettingsPage },
  // 구매자 앱
  { path: ROUTES.CONSUMER.HOME_BANNERS, element: HomeBannersListPage },
  { path: ROUTES.CONSUMER.TERMS, element: ConsumerTermsListPage },
  { path: ROUTES.CONSUMER.NOTICES, element: NoticesListPage },
  { path: ROUTES.CONSUMER.QNAS, element: QnasListPage },
  { path: ROUTES.CONSUMER.MEMBERS, element: ConsumerMembersListPage },
  { path: ROUTES.CONSUMER.REFUND_CANDIDATES, element: RefundCandidatesListPage },
  { path: ROUTES.CONSUMER.QUOTE_REQUESTS, element: QuoteRequestsListPage },
  { path: "/consumer/quote-requests/:requestId", element: QuoteRequestDetailPage },
  // 판매자 앱
  { path: ROUTES.SELLER.TERMS, element: SellerTermsListPage },
  { path: ROUTES.SELLER.MEMBERS, element: SellerMembersListPage },
  { path: ROUTES.SELLER.STORES, element: SellerStoresListPage },
  { path: ROUTES.SELLER.SEGMENTS, element: SellerSegmentsListPage },
] as const;
