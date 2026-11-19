/**
 * 경로 문자열만 정의 (페이지 컴포넌트 import 없음)
 * — route-config·인증/약관 UI 등에서 순환 참조 없이 import
 */
export const ROUTES = {
  ROOT: "/",
  MYPAGE: "/mypage",
  /** 휴대폰 번호 변경(SC-94 ③). PC도 같은 화면을 PC 틀 안에(기획 I-54) */
  MYPAGE_PHONE: "/mypage/phone",
  /** 회원 탈퇴(SC-95). PC도 같은 화면을 PC 틀 안에 */
  MYPAGE_WITHDRAW: "/mypage/withdraw",
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
  // 채팅(기획 I-11). 방 주소는 판매자 앱 휴대폰 알림 data.path(서버 buildSellerChatPath)와 같아야 한다
  STORE_DETAIL_CHATS: (storeId: string) => `/stores/${storeId}/chats`,
  STORE_DETAIL_CHAT_ROOM: (storeId: string, threadId: string) =>
    `/stores/${storeId}/chats/${threadId}`,
  /** 주문 상세 "채팅": 픽업 전 예약 손님에게 먼저(운영자 결정 11-11) */
  STORE_DETAIL_CHAT_ORDER: (storeId: string, orderId: string) =>
    `/stores/${storeId}/chats/order/${orderId}`,
  STORE_DETAIL_NOTIFICATIONS_SETTINGS: (storeId: string) =>
    `/stores/${storeId}/notifications/settings`,
  STORE_DETAIL_EDIT: (storeId: string) => `/stores/${storeId}/edit`,
  STORE_DETAIL_CALENDAR: (storeId: string) => `/stores/${storeId}/calendar`,
  /** 직접 적은 주문(기획 I-42) 적기. ?date=YYYY-MM-DD면 그 날이 미리 골라진다. PC도 같은 화면을 PC 틀 안에 */
  STORE_DETAIL_MANUAL_ORDER_CREATE: (storeId: string) => `/stores/${storeId}/manual-orders/new`,
  STORE_DETAIL_MANUAL_ORDER_DETAIL: (storeId: string, id: string) =>
    `/stores/${storeId}/manual-orders/${id}`,
  STORE_DETAIL_MANUAL_ORDER_EDIT: (storeId: string, id: string) =>
    `/stores/${storeId}/manual-orders/${id}/edit`,
  /** 휴대폰 앱 처음 사용 안내(SC-69, 앱에서만). PC 폭·휴대폰 브라우저에서는 스토어 홈으로 */
  STORE_DETAIL_WELCOME: (storeId: string) => `/stores/${storeId}/welcome`,
  /** 영업시간(쉬는 요일·영업시간, SC-81). PC도 같은 화면을 PC 틀 안에 */
  STORE_DETAIL_HOURS: (storeId: string) => `/stores/${storeId}/hours`,
  /** "스토어" 탭(링크 보내기·내 스토어·스토어 바꾸기). PC는 왼쪽 메뉴 "스토어" */
  STORE_DETAIL_MENU: (storeId: string) => `/stores/${storeId}/menu`,
  /** 설정(SC-98): 알림 설정·마이페이지·문의하기. PC는 왼쪽 메뉴 아래 "설정" */
  STORE_DETAIL_SETTINGS: (storeId: string) => `/stores/${storeId}/settings`,
  /** 그날 주문서 묶음 인쇄(PC에만, 기획 I-54). ?date=YYYY-MM-DD */
  STORE_DETAIL_PRINT_ORDERS: (storeId: string) => `/stores/${storeId}/print/orders`,
  AUTH: {
    LOGIN: "/auth/login",
    FIND_ACCOUNT: "/auth/login/find-account",
    GOOGLE_REDIRECT_URI: "/auth/login/google",
    KAKAO_REDIRECT_URI: "/auth/login/kakao",
    /** 네이버 Callback URL — 네이버 개발자센터 앱(손님과 같은 앱)에 환경별로 등록 */
    NAVER_REDIRECT_URI: "/auth/login/naver",
  },
  /** 운영자 대신 입력(기획 I-41) 들어오기(`?code=`)·끝난 화면. 서버 ACT_AS_SELLER_ENTRY_PATH와 같아야 한다 */
  ACT_AS: "/act-as",
  ACT_AS_ENDED: "/act-as/ended",
  TERMS: {
    TERMS_OF_SERVICE: "/terms/terms-of-service",
    PRIVACY_POLICY: "/terms/privacy-policy",
  },
} as const;
