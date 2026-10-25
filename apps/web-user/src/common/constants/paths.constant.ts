/**
 * 애플리케이션 경로 상수 관리
 * - 모든 라우팅 경로를 중앙에서 관리
 * - 경로 변경 시 한 곳에서만 수정하면 됨
 */

export const PATHS = {
  // 메인 페이지
  HOME: "/",

  // 스토어 관련 경로
  STORE: {
    DETAIL: (storeId: string) => `/store/${storeId}`,
  },

  // 상품 관련 경로
  PRODUCT: {
    DETAIL: (productId: string) => `/product/${productId}`,
  },

  // 검색 관련 경로
  SEARCH: "/search",

  // 장바구니 관련 경로
  CART: "/cart",

  // 지도 페이지
  MAP: "/map",
  MAP_SEARCH: "/map/search",

  // 저장 페이지
  SAVED: "/saved",
  MY_SAVED: "/mypage/saved",

  // 주문 관련 경로
  ORDER: {
    DETAIL: (orderId: string) => `/order/${orderId}`,
    CANCEL: (orderId: string) => `/order/${orderId}/cancel`,
    CANCEL_REFUND: (orderId: string) => `/order/${orderId}/cancel/refund`,
    CANCEL_DETAIL: (orderId: string) => `/order/${orderId}/cancel-detail`,
    REFUND_ACCOUNT: (orderId: string) => `/order/${orderId}/refund-account`,
  },

  // 마이페이지
  MYPAGE: "/mypage",
  MY_ORDERS: "/mypage/order",
  MY_REVIEWS: "/mypage/reviews",
  REVIEW_LIST: "/mypage/reviews/list",
  REVIEW_WRITE: (orderId: string) => `/mypage/reviews/write?orderId=${orderId}`,
  RECENT: "/mypage/recent",
  NOTICE: "/mypage/notice",
  QNA: "/mypage/qna",
  SUPPORT: "/mypage/support",
  SETTING: "/mypage/setting",
  SETTING_ACCOUNT: "/mypage/setting/account",
  SETTING_NOTIFICATION: "/mypage/setting/notification",
  TERMS: {
    TERMS_OF_SERVICE: "/mypage/terms/terms-of-service",
    PRIVACY_POLICY: "/mypage/terms/privacy-policy",
    LOCATION_TERMS: "/mypage/terms/location-terms",
    THIRD_PARTY_CONSENT: "/mypage/terms/third-party-consent",
  },
  VERSION: "/mypage/version",

  // 알람 페이지
  ALARM: "/alarm",

  // QA/테스트 전용 페이지
  QA: "/qa",

  /**
   * 앱 다운로드 진입점 — 명함 QR에 넣는 주소(`https://picakes.com/app`).
   * UA에 따라 App Store / Play Store / 웹으로 분기합니다.
   */
  APP_DOWNLOAD: "/app",

  /**
   * 입점 안내 진입점 — 사장님께 보여주는 QR에 넣는 주소(`https://picakes.com/partner`).
   * 입점 소개 페이지와 사전 수요조사 설문으로 연결합니다.
   */
  PARTNER: "/partner",
  /** 입점 소개 페이지 (`/partner` 의 "소개페이지 바로가기") */
  PARTNER_ABOUT: "/partner/about",

  AUTH: {
    /** 로그인 화면 (로그인이 필요한 상황에서 이동) */
    LOGIN: "/auth/login",
    GOOGLE_REDIRECT_URI: "/auth/login/google",
    GOOGLE_REGISTER: "/auth/register/google",
    KAKAO_REDIRECT_URI: "/auth/login/kakao",
    KAKAO_REGISTER: "/auth/register/kakao",
    /** Apple Return URL — Services ID 등록값과 정확히 일치해야 함(POST route.ts, 쿼리 아님) */
    APPLE_REDIRECT_URI: "/auth/login/apple",
    /** route.ts가 code를 쿼리로 붙여 리다이렉트하는 내부 콜백 페이지 (Google/Kakao의 REDIRECT_URI 페이지에 대응) */
    APPLE_CALLBACK: "/auth/login/apple/callback",
    APPLE_REGISTER: "/auth/register/apple",
  },
} as const;
