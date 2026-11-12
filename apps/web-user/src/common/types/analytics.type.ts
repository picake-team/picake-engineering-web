/**
 * PostHog 커스텀 이벤트 텍소노미 타입 정의
 * 이벤트명·속성은 기획팀 데이터 이벤트 텍소노미 문서를 그대로 반영합니다.
 * 도메인이 추가될 때마다 이 맵에 이벤트를 추가합니다. (현재: 주문과정, 로그인/회원가입, 마이페이지, 홈/검색, 지도, 견적 요청 도메인)
 *
 * 모든 이벤트에 붙는 속성(posthog.config): app, environment, surface(app = 손님 앱 웹뷰, web = 브라우저)
 *
 * 예외:
 * - fail_reservation_timeout(입금 시간 초과 자동취소)은 백엔드 스케줄러가 발생시키는
 *   서버 사이드 이벤트라 프런트엔드에서 신뢰성 있게 계측할 수 없어 이 맵에서 제외했습니다.
 * - view_category_detail(카테고리 상세 화면)은 카테고리 UI 자체가 아직 클릭 불가능한 mock이고
 *   실제 카테고리 상세 라우트가 없어 이 맵에서 제외했습니다.
 */

/** 상품 상세로 진입한 화면 */
export type ProductEntryPoint = "home" | "search" | "category" | "map";

/** 상품 상세 탭 메뉴 */
export type ProductTabName = "detail" | "size_taste" | "review" | "info";

/** 예약 완료 화면에서 선택한 버튼 */
export type ReservationCompleteAction = "reservation" | "home";

/**
 * 로그인/회원가입 진입을 유발한 지점.
 * `session_expired` 는 사용자가 누른 게 아니라 401 등으로 로그인이 요구된 경우다.
 */
export type LoginEntryPoint =
  | "reservation_button"
  | "save_menu"
  | "mypage"
  | "like_button"
  | "session_expired"
  | "quote_request"
  | "chat";

/** 소셜 로그인 제공자 */
export type OAuthProvider = "kakao" | "google" | "apple";

/** 기존 계정과 중복으로 판단된 기준 */
export type DuplicateAccountType = "social" | "phone_number";

/** 소셜 로그인 인증 실패 사유 */
export type SocialAuthFailReason = "cancel" | "network_error" | "auth_error";

/** 핸드폰 번호 인증 실패 사유 */
export type PhoneVerificationFailReason = "invalid_code" | "expired_code" | "duplicate_number";

/** 마이페이지 상단 예약 상태 카드 상태 */
export type ReservationCardStatus = "pending_payment" | "confirmed";

/** 예약 상세 진입 경로 */
export type ReservationDetailEntryPoint =
  | "mypage_card"
  | "reservation_list"
  | "payment_alarm"
  | "reservation_complete";

/** 채팅 입구(기획 I-11): 스토어 문의 창(스토어 상세) / 스토어 문의 창(예약에서 열어 주문 카드가 붙음) / MY 바로가기 */
export type ChatEntryPoint = "store_inquiry" | "order_inquiry" | "mypage";

/** 간편 입금 결제 수단 */
export type EasyPaymentMethod = "toss" | "kakao";

/** 예약취소 시점의 환불 가능 상태 */
export type RefundStatus = "before_payment" | "available" | "non-available";

/** 예약 변경 종류 */
export type ReservationChangeType = "pickup_date" | "product_option";

/** 내 예약 화면 탭 */
export type ReservationTabName = "upcoming" | "past";

/** 지난 예약 상태 필터 */
export type ReservationFilterName = "all" | "pickup_waiting" | "pickup_complete" | "cancelled";

/** 지도 재검색을 유발한 원인 */
export type MapAreaSearchTrigger = "drag" | "zoom" | "current_location";

/** 견적 요청서로 들어온 곳(서버 QuoteRequest.entry를 소문자로, 주소로 바로 열면 direct) */
export type QuoteEntryPoint = "home" | "search" | "map" | "store" | "mypage" | "direct";

/** 견적 요청서 단계(이 가게에만 물어보면 where·stores 없이 4단계) */
export type QuoteStepName = "when" | "where" | "stores" | "cake" | "size_budget" | "confirm";

/** 견적 요청을 보내지 못한 이유 */
export type QuoteRequestFailReason = "pickup_time" | "api_error";

/** 견적을 보낸 가게: picake = 입점 가게, unentered = 입점 전 가게(견적 링크·운영자 대신 적기) */
export type QuoteStoreType = "picake" | "unentered";

/** 견적 링크(사장님 쪽)에서 본 이 가게 상태 */
export type QuoteLinkState =
  | "OPEN"
  | "SENT"
  | "DECLINED"
  | "CHOSEN_ME"
  | "CHOSEN_OTHER"
  | "CLOSED"
  | "FULL";

export interface AnalyticsEventMap {
  // ── 주문과정 ──
  /** 상품 상세 페이지 노출 (일반/주문제작 분기) */
  view_product_detail: { product_id: string; entry_point: ProductEntryPoint };
  /** 탭 클릭 → 해당 섹션으로 전환 */
  engage_product_tab_menu: { tab_name: ProductTabName };
  /** 상품 '예약하기' 버튼 클릭 */
  engage_reservation: never;
  /** 상품옵션선택 화면에서 머무른 시간, 상품옵션선택 > '선택완료' 버튼 클릭 시 */
  request_option_complete: { duration_ms: number; product_id: string };
  /** 주문 확인 화면 view 이벤트 */
  view_order_confirm: never;
  /** 옵션변경 버튼 클릭 시 */
  engage_edit_option: never;
  /** 상품추가 버튼 클릭 시 */
  engage_add_product: never;
  /** 예약 요청에 포함된 상품 개수, 예약하기 버튼 클릭 시 */
  request_reservation: { product_count: number; product_id: string };
  /** 생성된 예약 건의 고유 식별자, 예약완료(서버) */
  success_reservation: { reservation_id: string };
  /** 예약완료 후 결과화면 */
  view_reservation_confirm: { reservation_id: string };
  /** 스토어 상세화면 */
  view_store_detail: { store_id: string };
  /** 삭제하려는 상품 고유 식별자, 주문 확인 화면 > 상품 삭제 버튼 클릭 */
  engage_delete_product: { product_id: string };
  /** 예약 완료 화면 > 예약 내역 보기 또는 홈으로 가기 버튼 클릭 */
  engage_reservation_complete_action: {
    reservation_id: string;
    action: ReservationCompleteAction;
  };

  // ── 로그인/회원가입 ──
  /** 로그인/회원가입 진입 화면 노출 (entry_point의 트리거 지점에서 진입) */
  view_login_entry: { entry_point: LoginEntryPoint };
  /** 소셜 로그인/가입 버튼 클릭 → 외부 인증 화면 전환 */
  engage_social_select: { provider: OAuthProvider };
  /** 소셜 서비스 인증 완료 후 서버로 로그인/가입 요청 발생 */
  request_social_auth: { provider: OAuthProvider };
  /** 기존 회원 로그인 완료 (인증 단계 없이 즉시 완료) */
  success_login: { provider: OAuthProvider; user_id: string };
  /**
   * "이미 가입한 계정이 있어요" 화면 노출 (신규가입 시도했으나 기존 회원인 경우)
   * existing_user_id는 백엔드 409 응답에 포함되지 않아 현재 전송하지 않음
   */
  view_duplicate_account: { provider: OAuthProvider; duplicate_type: DuplicateAccountType };
  /** 핸드폰 번호 인증 화면 노출 (소셜 회원가입 시에만 거치는 단계) */
  view_phone_verification: { provider: OAuthProvider };
  /** 인증번호 요청 발송 (인증번호 받기 버튼 클릭) */
  request_phone_verification: { provider: OAuthProvider };
  /** 핸드폰 번호 인증 성공 */
  success_phone_verification: { provider: OAuthProvider };
  /** 핸드폰 번호 인증 실패 */
  fail_phone_verification: { fail_reason: PhoneVerificationFailReason };
  /** 약관 동의 완료 → 서버로 회원가입 요청 발생 */
  request_signup: { provider: OAuthProvider };
  /** 신규 회원가입 완료 */
  success_signup: { provider: OAuthProvider; user_id: string };
  /** 소셜 로그인 인증 실패 */
  fail_social_auth: { provider: OAuthProvider; fail_reason: SocialAuthFailReason };
  /** 중복가입 안내 화면 > 로그인 버튼 클릭 */
  engage_duplicate_login: { provider: OAuthProvider };

  // ── 마이페이지 ──
  /** 마이페이지 메인 화면 노출 */
  view_mypage: never;
  /** 마이페이지 상단 예약 상태 카드 노출 */
  view_mypage_reservation_card: { card_status: ReservationCardStatus; reservation_id: string };
  /** "내 예약" 메뉴 진입 - 전체 예약 목록 화면 노출 */
  view_reservation_list: never;
  /** 예약 상세 페이지 노출 (카드 선택 또는 목록에서 진입) */
  view_reservation_detail: {
    reservation_id: string;
    status: string;
    entry_point: ReservationDetailEntryPoint;
  };
  /** "간편 입금하기" 버튼 클릭 */
  engage_easy_payment: { reservation_id: string };
  /** 간편 입금하기 바텀시트 노출 */
  view_easy_payment_option: { reservation_id: string };
  /** 간편 입금하기 > 토스/카카오페이 선택 */
  engage_easy_payment_option: { reservation_id: string; payment_method: EasyPaymentMethod };
  /** 입금 대기 중인 예약이 있어요 팝업 알림 노출 */
  view_payment_alarm: { reservation_id: string };
  /** "입금 완료했어요" 버튼 클릭 */
  engage_payment_complete: { reservation_id: string };
  /** "입금정보확인" 바텀시트 노출 */
  view_payment_info_confirm: { reservation_id: string };
  /** 입금완료 확인 (입금대기 → 입금완료 상태 전환) */
  success_payment_complete: { reservation_id: string };
  /** 예약상세 > 예약취소 버튼 클릭 */
  engage_cancel_reservation: { reservation_id: string };
  /**
   * 구매자에 의한 예약취소 요청 (예약취소 페이지 > 예약취소 버튼 / 예약취소요청 버튼)
   * refund_status의 non-available은 현재 코드상 도달 경로가 없음 (취소 가능 상태에서만 버튼 노출)
   */
  request_cancel_reservation: {
    reservation_id: string;
    cancel_reason: string;
    status: string;
    refund_status: RefundStatus;
  };
  /** 예약취소 완료 (구매자 취소) */
  success_cancel_reservation: { reservation_id: string };
  /** 내 후기 페이지 */
  view_review_list: never;
  /** 내 후기 > 작성후기선택 페이지 */
  view_review_option_list: never;
  /** 후기 작성 버튼 클릭(내 리뷰 / 내 예약 진입지점 2개) → 후기 작성 화면 전환 */
  engage_review_write: { reservation_id: string };
  /** 후기 작성 완료 */
  success_review_submit: { reservation_id: string };
  /** 내 예약 화면 > 픽업예정/지난예약 탭 클릭 */
  engage_reservation_tab: { tab_name: ReservationTabName };
  /** 내 예약 > 지난예약 화면에서 예약 상태 필터 클릭 */
  engage_reservation_filter: { filter_name: ReservationFilterName };
  /** 예약 상세에서 픽업 날짜 또는 상품 옵션 변경 요청 */
  request_change_reservation: { reservation_id: string; change_type: ReservationChangeType };
  /** 픽업 날짜 또는 상품 옵션 변경 완료 */
  success_change_reservation: { reservation_id: string; change_type: ReservationChangeType };
  /** 예약 취소 과정에서 환불 계좌정보 입력 후 확인 버튼 클릭 */
  request_refund_info: { reservation_id: string };
  /** 환불 계좌정보 등록 완료 */
  success_refund_info: { reservation_id: string };

  // ── 홈/검색 ──
  /** 홈 화면 노출 */
  view_home: never;
  /** 검색창 클릭 */
  engage_search_bar: never;
  /** 검색 화면(입력 전) 노출 */
  view_search: never;
  /** 검색어 입력 후 검색 실행 (검색 버튼 클릭 또는 엔터) */
  request_search: { keyword: string };
  /** 검색 결과 화면 노출 (결과 0건 이상) */
  view_search_result: { keyword: string; result_count: number };
  /** 필터 아이콘 클릭 → 정렬&필터 바텀시트 전환 (홈/검색) */
  engage_filter: never;
  /**
   * 홈/검색 필터 적용시 (지도 필터 적용은 success_map_filter_apply로 분리)
   * 정렬 기준 선택, 사이즈 필터, 최소/최대 가격, 타입 필터, 적용 후 결과 개수
   */
  success_filter_apply: {
    sort_type?: string;
    size_filter?: string;
    price_min?: number;
    price_max?: number;
    type_filter?: string;
    result_count: number;
  };
  /** 헤더 위치 텍스트 클릭 → 지역설정 화면 전환 */
  engage_location_setting: never;
  /** 지역설정 변경 완료 (지역 선택 후 적용) */
  success_location_change: { selected_regions: string; region_count: number };

  // ── 지도 ──
  /** 지도 화면 노출 */
  view_map: never;
  /** 목록 뷰 노출 */
  view_map_list: never;
  /** 지도 상 스토어 핀 클릭 → 하단 스토어 정보 노출 (스토어 없을 때는 'none') */
  engage_store_pin: { store_id: string };
  /** 검색창 클릭 → 검색 화면 전환 */
  engage_map_search_bar: never;
  /** 검색어 입력 후 검색 실행 */
  request_map_search: { keyword: string };
  /** 검색 결과 화면 노출 (0건 포함) */
  view_map_search_result: { keyword: string; result_count: number };
  /** 픽업 날짜 선택 영역 클릭 → 날짜/시간 선택 바텀시트 전환 */
  engage_date_picker_open: never;
  /** 픽업 날짜·시간 선택 완료 (기본값: 오늘) */
  success_pickup_date_select: { selected_date: string; selected_time_slot: string };
  /** 필터 아이콘 클릭 → 정렬&필터 바텀시트 전환 (지도) */
  engage_map_filter_open: never;
  /** 현재 위치 버튼 클릭 */
  engage_current_location: never;
  /** 지도 이동 또는 현재 위치 설정 후 해당 영역의 스토어 검색 완료 */
  success_map_area_search: { trigger_type: MapAreaSearchTrigger; result_count: number };
  /**
   * 지도 필터 적용 완료 (홈/검색의 success_filter_apply와 별개 — 지도는 정렬(sort_type) 개념이 없음)
   * 사이즈 필터, 최소/최대 가격, 타입 필터, 적용 후 결과 개수
   */
  success_map_filter_apply: {
    size_filter?: string;
    price_min?: number;
    price_max?: number;
    type_filter?: string;
    result_count: number;
  };

  // ── 견적 요청(I-46) ──
  /** 견적 요청서의 한 단계가 보임(단계별 이탈: step_number 1 → total_steps → success_quote_request) */
  view_quote_step: {
    step_name: QuoteStepName;
    step_number: number;
    total_steps: number;
    entry_point: QuoteEntryPoint;
    only_store: boolean;
  };
  /** 확인 단계에서 '견적 요청 보내기'를 누름(로그인한 상태, 사진 올리기 전) */
  request_quote_request: {
    entry_point: QuoteEntryPoint;
    only_store: boolean;
    photo_count: number;
    store_count: number;
  };
  /** 견적 요청이 만들어짐(서버 응답) */
  success_quote_request: { quote_request_id: string; entry_point: QuoteEntryPoint };
  /** 견적 요청을 보내지 못함(pickup_time = 그새 3시간 안이 됨, api_error = 사진 올리기·서버 오류) */
  fail_quote_request: { entry_point: QuoteEntryPoint; fail_reason: QuoteRequestFailReason };

  // ── 견적 ②(I-46): 손님이 견적을 보고 고름. 성공 기준: 받은 견적 → 고른 요청 비율 ──
  /** 요청 상세에서 받은 견적을 봄(열 때 한 번). unseen_count = 처음 보는 견적 수 */
  view_quote_detail: {
    quote_request_id: string;
    status: string;
    quote_count: number;
    unseen_count: number;
  };
  /** 견적 카드에서 그 가게와 채팅을 엶(고르기 전 "채팅으로 묻기"·고른 뒤 "채팅하기") */
  engage_quote_chat: { quote_request_id: string; store_type: QuoteStoreType; chosen: boolean };
  /** 고르기 창에서 "고르기"를 누름(서버 응답 전). rechoose = 이미 고른 뒤 다른 견적으로 바꿈 */
  request_quote_choose: { quote_request_id: string; store_type: QuoteStoreType; rechoose: boolean };
  /** 견적을 골랐음(서버 응답) */
  success_quote_choose: {
    quote_request_id: string;
    store_type: QuoteStoreType;
    rechoose: boolean;
    quote_count: number;
  };
  /** 고르지 못함(마감·다른 기기에서 바뀜 등 서버 오류) */
  fail_quote_choose: { quote_request_id: string; fail_reason: "api_error" };

  // ── 견적 링크(I-46 SC-19, 입점 전 가게 사장님 — 로그인 없음) ──
  /** 사장님이 견적 링크를 엶(한 번). state = 이 가게 쪽 상태 */
  view_quote_link: { quote_request_id: string; state: QuoteLinkState };
  /** 링크에서 견적을 보냄·고침(서버 응답) */
  success_quote_link_submit: {
    quote_request_id: string;
    edited: boolean;
    similarity: string;
    photo_count: number;
    contact_types: string;
  };
  /** 링크에서 "어려워요"로 답함 */
  success_quote_link_decline: { quote_request_id: string; reason: string };
  /** 링크 안 대화에서 사장님이 글을 보냄(글 내용은 보내지 않는다) */
  success_quote_link_chat: { quote_request_id: string };

  // ── 채팅(I-11) ── 성공 기준: 문의 → 예약 전환율(같은 가게 store_id로 success_reservation과 잇는다)
  /** 채팅 입구를 누름(채팅이 열려 있을 때만 보임) */
  engage_chat_entry: { entry_point: ChatEntryPoint; store_id?: string };
  /** 글이 보내짐(서버 응답). is_first = 이 가게에 처음 보내 방이 생김. 글 내용은 보내지 않는다 */
  success_chat_message: {
    thread_id: string;
    store_id: string | null;
    is_first: boolean;
    photo_count: number;
    with_card: boolean;
  };
}

export type AnalyticsEventName = keyof AnalyticsEventMap;
