/**
 * 경로 문자열만 정의 (페이지 컴포넌트 import 없음)
 * — route-config·인증/약관 UI 등에서 순환 참조 없이 import
 */
export const ROUTES = {
  ROOT: "/",
  MYPAGE: "/mypage",
  STORE_CREATE: "/store/create",
  STORE_DETAIL_HOME: (storeId: string) => `/stores/${storeId}`,
  STORE_DETAIL_PRODUCTS: (storeId: string) => `/stores/${storeId}/products`,
  STORE_DETAIL_PRODUCTS_LIST: (storeId: string) => `/stores/${storeId}/products/list`,
  STORE_DETAIL_PRODUCTS_CREATE: (storeId: string) => `/stores/${storeId}/products/create`,
  STORE_DETAIL_PRODUCTS_DETAIL: (storeId: string, productId: string) =>
    `/stores/${storeId}/products/${productId}`,
  STORE_DETAIL_FEED_LIST: (storeId: string) => `/stores/${storeId}/feed`,
  STORE_DETAIL_FEED_CREATE: (storeId: string) => `/stores/${storeId}/feed/create`,
  STORE_DETAIL_FEED_DETAIL: (storeId: string, feedId: string) =>
    `/stores/${storeId}/feed/${feedId}`,
  STORE_DETAIL_ORDERS_LIST: (storeId: string) => `/stores/${storeId}/orders`,
  STORE_DETAIL_ORDERS_DETAIL: (storeId: string, orderId: string) =>
    `/stores/${storeId}/orders/${orderId}`,
  STORE_DETAIL_STATISTICS_ORDERS: (storeId: string) => `/stores/${storeId}/statistics/orders`,
  STORE_DETAIL_NOTIFICATIONS_LIST: (storeId: string) => `/stores/${storeId}/notifications`,
  STORE_DETAIL_NOTIFICATIONS_SETTINGS: (storeId: string) =>
    `/stores/${storeId}/notifications/settings`,
  STORE_DETAIL_EDIT: (storeId: string) => `/stores/${storeId}/edit`,
  STORE_DETAIL_CALENDAR: (storeId: string) => `/stores/${storeId}/calendar`,
  /** 휴대폰 화면 "스토어" 탭(내 스토어·설정 메뉴). PC 화면에는 없어 PC 폭에서는 스토어 홈으로 */
  STORE_DETAIL_MENU: (storeId: string) => `/stores/${storeId}/menu`,
  AUTH: {
    LOGIN: "/auth/login",
    FIND_ACCOUNT: "/auth/login/find-account",
    GOOGLE_REDIRECT_URI: "/auth/login/google",
    KAKAO_REDIRECT_URI: "/auth/login/kakao",
  },
  TERMS: {
    TERMS_OF_SERVICE: "/terms/terms-of-service",
    PRIVACY_POLICY: "/terms/privacy-policy",
  },
} as const;
