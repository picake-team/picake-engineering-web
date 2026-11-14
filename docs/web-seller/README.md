# Picake Web Seller

Picake 플랫폼을 위한 React + Vite 기반 판매자 관리 시스템입니다. Shadcn/ui + Tailwind CSS와 최신 웹 기술을 활용하여 직관적이고 효율적인 판매자 경험을 제공합니다.

## 🏗️ 주요 기능

### ✅ 구현 완료

- **인증 시스템**: Google OAuth, Kakao OAuth, 계정 찾기
- **관리자 레이아웃**: 반응형 사이드바, 헤더, 네비게이션
- **사업자진위확인**: 국세청 API를 통한 사업자등록번호 진위확인
- **스토어 등록**: 사업자 진위확인 → 스토어 정보 입력 및 생성(통신판매사업자 단계는 꺼 둠, [가이드](../common/feature/스토어%20등록%20-%20가이드.md))
- **스토어 관리**: 스토어 정보 수정, 홈 대시보드, 캘린더
- **스토어 만들기**: 2단계(사업자 진위 확인 → 스토어 정보). 통신판매업 신고 정보 단계는 `REQUIRE_ONLINE_TRADING_REGISTRATION`(false)로 꺼 둠(법 검토: 동네 음식료 판매는 전자상거래법 제3조 ④로 신고 의무 없음). true로 바꾸면 3단계로 돌아옴
- **스토어 등록·수정 폼**: 상품 폼과 같은 모양(섹션: 기본 정보 → 손님 연락 채널 → 위치 → 정산 계좌 → 환불·취소 규정), 아래에 붙은 저장 버튼, 막는 칸이 있으면 "고칠 곳 n개 보기"로 그 섹션으로 이동, 설명 최대 2,000자(`features/store/components/forms/StoreCreationForm.tsx`, 섹션 틀은 `common/components/sections/FormSection.tsx`)
- **네이버 플레이스 가져오기**: 스토어 등록·수정 위 한 줄 안내의 버튼으로 창을 열어 네이버 링크로 이름·설명·연락처·인스타그램 ID를 골라 채우고 네이버 매장 연결·해제, 캘린더에서 네이버 영업시간으로 정기 휴무·표준 영업시간 채우기(`features/store/components/naver/`)
- **상품 관리**: 상품 목록, 등록, 상세/수정, 고시는 원산지만 받음(`PRODUCT_NOTICE_MODE`, 법 검토: 동네 음식료 판매는 전자상거래법 제3조 ④로 상품정보제공 고시 미적용, 원산지는 원산지표시법). "ALL"로 바꾸면 14개 항목·고시 복사가 돌아옴
- **네이버 상품 가져오기**: 상품 등록 위 "네이버에서 가져오기" 창에서 연결한 네이버 매장의 예약 상품을 골라 이름·설명·사진·사이즈별 가격·추가 옵션(네이버 맛 분류는 필수 "맛")을 묶음 단위로 골라 채우고(내 상품이 맞아요, 채우기) 등록 때 네이버 상품도 연결, "옵션 하나씩 정하기"를 펼치면 옵션마다 사이즈·판매가·추가 옵션·넣지 않음을 고르고, 포장주문처럼 묶인 상품은 옵션 하나만 상품으로 가져오기, 상품 수정에서 다시 불러와 비교(기본 미선택)·품절·사라진 상품 안내(`features/product/components/naver/`)
- **상품 등록·수정 폼**: 탭 없이 한 화면(사진 → 이름·종류 → 가격·사이즈(손님 결제 금액 표시) → 추가 옵션(맛도 여기: 하나 고르기 "맛") → 상세 설명 → 원산지), 같은 사이즈 두 번 금지, 옆 칸에 판매 상태·분류·태그, 아래에 붙은 저장 버튼. 저장을 막는 칸이 있으면 그 섹션으로 이동(`features/product/components/forms/ProductCreationForm.tsx`)
- **단위 테스트**: `yarn workspace @picake/web-seller test` (vitest `unit` 프로젝트, `src/**/*.test.ts`). 네이버 가져오기 가격 계산 등 순수 로직
- **상세정보 AI 초안**: 상세 설명의 "AI로 쓰기" 창에서 네이버 설명·확인한 사실로 초안을 만들어 바꾸거나 끝에 붙이기. `[판매자 확인 필요]`가 남으면 저장되지 않음
- **주문 관리**: 주문 목록, 주문 상세, 상태 관리
- **피드 관리**: 피드 목록, 작성, 상세
- **통계**: 주문/매출 통계 대시보드
- **알림**: 알림 목록, 알림 설정
- **견적 예약(기획 I-01)**: 손님이 고른 입점 가게 견적으로 예약하면 주문 탭에 예약신청으로 들어온다(이후는 상품 예약과 같음). 주문 상세(휴대폰·PC)에 "견적 예약" 칸(손님 요청서·요청 사항·참고 사진·내 견적 메모), 채팅 요청서 카드에 [예약 보기]. 손님이 예약하기 전까지는 고른 견적도 고칠 수 있다. 참고 사진이 여러 장이면 1·2·3 번호(손님 설명의 "1번 사진처럼"과 맞춤).
- **채팅(기획 I-11)**: 아래 탭 "채팅"(홈·주문·상품·채팅·스토어, 캘린더는 홈 "캘린더 보기"로), 목록 `/stores/:storeId/chats`(답할 것/전체), 방 `/chats/:threadId`(판매자 앱 푸시 `data.path`와 같음), 주문 상세 연락처 옆 "채팅"으로 픽업 전 예약 손님에게 먼저(`/chats/order/:orderId`, 첫 글에 주문 카드). 홈 "처리할 일"의 "견적 요청"·"답할 채팅", 알림 설정의 채팅 알림·밤 끄기. 손님 견적 요청(기획 I-46 ②)은 그 손님 채팅방 맨 위 요청서 카드로 와서 [어려워요]·[견적 보내기](금액·비슷한 정도·사진·메모, 주문 받는 곳은 묻지 않음)로 답하고, 손님이 고르면 그 방에서 주문을 정한다(`features/quote/components/QuoteRequestPanel.tsx`). 요청서 카드의 사진은 번호만(가져올 것은 설명 글에), 설명은 6줄까지 보이고 실제로 잘렸을 때만 "더 보기", 케이크는 1개면 "1호 케이크 · 생크림"처럼 개수 없이(기획 I-112, 11-14). 사진을 누르면 앱 어디서나 `ImageLightbox`(확대·돌리기·넘기기·앱에서 사진 저장). 관리자가 연 뒤에만 보임. 자세한 것은 `docs/common/feature/채팅 시스템 - 가이드.md`
- **마이페이지**: 판매자 정보 조회/수정
- **상태 관리**: Zustand를 활용한 전역 상태 관리
- **API 통신**: TanStack Query + Axios를 활용한 서버 상태 관리
- **에러 처리**: Error Boundary와 Sentry 연동
- **디자인 시스템**: Shadcn/ui + Tailwind CSS (Material-UI에서 마이그레이션 완료)

### 🔄 개발 중

- 재고 관리
- **휴대폰 화면(판매자 앱 "픽케이크 사장님", 기획 I-48)**: 같은 주소에 휴대폰 화면을 더함. 모든 환경(production 포함, 2026-11-06부터)에서 폭 767px 이하일 때 휴대폰 화면, 넓으면 지금 PC 화면(`common/constants/screen.constant.ts`). 부품은 `common/ui/`(디자인 기준 B, **[판매자 앱 디자인 기준](./판매자%20앱%20디자인%20기준.md)**, Storybook "판매자 앱/부품", 색은 공통 패키지 `@picake/design-tokens`에서 가져오고 판매자 앱 값은 `common/ui/tokens.ts`), 구조는 [프로젝트 구조 가이드](../common/structure/프로젝트%20구조%20-%20가이드.md#판매자-웹의-휴대폰-화면-2026-11-06-판매자-앱-i-48)
  - 만든 화면: 홈(`/stores/:storeId`, 주간 달력·처리할 주문·고른 날 픽업·이번 주 매출·첫 상품 안내), 주문 목록(`/orders`, 처리할 것·진행 중·지난 주문 탭과 할 일 칸, 찾기·상태 안내·목록에서 바로 처리, `?tab=&group=&q=`), 주문 상세(`/orders/:orderId`, 단계·입금 마감·처리 창·전화·문자·복사, 맨 위 할 일 안내 문장 없음), 알림 목록(`/notifications`), 스토어 탭(`/stores/:storeId/menu`, 링크 보내기(복사·공유, 보내는 주소에 `?from=link`, 최근 30일 링크로 온 손님·예약 신청 수 — 기획 I-45)·내 스토어·스토어 바꾸기, 위쪽 톱니 = 설정), 설정(`/stores/:storeId/settings`, 알림 설정·마이페이지·문의하기 — 카카오톡 채널 "픽케이크" 1:1 채팅으로 바로). 아직 없는 화면은 휴대폰 폭에서도 PC 화면
  - 캘린더(`/calendar`, 달력 하나·점·휴무·바꿈, 고른 날 픽업. 그날만 영업 바꾸기는 PC 캘린더에서), 영업시간(`/hours`, 쉬는 요일·30분 간격 시각·네이버 영업시간으로 채우기), 주문 통계(`/statistics/orders`, 기간 빠른 선택·잘 팔린 상품·요일/시간대 접기), 알림 설정(`/notifications/settings`, 주문 알림 끌 때 확인·아침 요약·테스트 알림), 마이페이지(`/mypage`, 프로필 수정 창·계정 정보·로그아웃 창), 휴대폰 번호 변경(`/mypage/phone`), 회원 탈퇴(`/mypage/withdraw`, 진행 중 주문 미리 안내). 영업시간·휴대폰 번호 변경·탈퇴 주소는 PC 폭에서 캘린더·마이페이지로, 스토어 탭·설정은 스토어 홈으로
  - 상품 목록(`/products`, 검색·정렬과 거르기 창·전체/판매중/판매중지/숨김·판매 상태 바로 바꾸기와 되돌리기). 상품 등록·수정, 피드(목록·등록·수정), 스토어 정보, 스토어 만들기는 PC 화면과 같은 코드를 휴대폰 틀(`MobileFrame`, 뒤로 + 제목)에 담아 쓰고, 틀 안에서는 PC 부품(`BaseButton`·`BaseInput`·`Textarea`·`Label`·`FormSection`·`Checkbox`·`Dialog`·`SelectTrigger`·`Card`·`ImageMultiUpload`)이 `useInMobileFrame()`으로 판매자 앱 디자인대로 그려진다(입력 48·모서리 12·묶음 사이 선·카드 없음, 디자인 6-E·6-F·6-G·A90·A91·8-E·8-F·A66b). 디자인이 다른 곳만 따로 그린다: 상품 종류 카드·판매 상태 스위치·옵션값 두 줄·환불 규정 줄·피드 목록 줄·스토어 만들기 진행 막대. 틀 안에서는 색을 앱 기준으로 바꾸고(`<html class="app-form">`, `globals.css`: 주 버튼·체크 주황, 고칠 곳 #B5401C, 글쓰기 편집기 테두리) 아래 저장 줄은 가득 찬 버튼으로(`mobile-frame.context.ts`)
  - 로그인(`/auth/login`, 로고·카카오·구글로 시작하기·"처음이세요?"(사장님 소개 페이지 info.picakes.com/seller/about, 앱에서는 휴대폰 브라우저로)·계정 찾기. 약관·처리방침·버전은 두지 않음), 소셜 로그인 콜백의 회원가입(실명 → 휴대폰 인증 → 약관 동의 → "가입하기", 손님 앱과 같게)과 이미 가입한 계정 안내(그 수단으로 로그인), 계정 찾기(`/auth/login/find-account`). 스토어가 없으면 첫 화면에서 바로 스토어 만들기(휴대폰 틀). Apple 로그인 버튼은 서버·애플 계정 설정 뒤에 켠다(`SELLER_APPLE_LOGIN_ENABLED`)
  - 앱 연결(`common/utils/webview.bridge.ts`, `SellerAppBridgeProvider`): 로그인하면 이 휴대폰을 알림 받을 곳으로 등록, 로그아웃하면 해제, 알림 허용 상태·허용 창·휴대폰 설정, 처음 사용 안내(`/welcome`, 앱에서만), 홈 "휴대폰 알림이 꺼져 있어요", 알림 설정 "이 휴대폰 알림", 공유 창·사진 저장·바깥 링크(`apps://`)·앱 버전. 앱이 채널을 넣지 않으면 휴대폰 브라우저처럼 동작. 약속은 [판매자 앱 - 앱담당자 요청서](../common/feature/판매자%20앱%20-%20앱담당자%20요청서.md)
  - 로그인이 풀린 채 연 주소(알림으로 연 주문 등)는 기억했다가 로그인 뒤 그곳으로(`return-to.util.ts`). 주문 상태를 바꾸면 PostHog `success_order_status_change`(앱·휴대폰 브라우저·PC 구분)
  - 실시간 알림(소켓)이 오면 주문 목록·홈 숫자도 새로 불러오고, 이 화면에서 방금 바꾼 주문의 알림 띠는 겹쳐 띄우지 않음(`recent-order-change.util.ts`)
  - 주소 검색(스토어 정보·만들기): 앱(웹뷰)은 새 창을 열지 못해 휴대폰 틀 안에서는 아래에서 올라오는 창 안에 카카오 우편번호 검색을 그린다(`AddressSearchSheet`, `embedAddressSearch`, SC-67). PC는 지금처럼 새 창

## 🔗 주요 페이지

### 인증 관련

- **로그인**: `/auth/login` - Google/Kakao 소셜 로그인
- **심사용 로그인 창**(휴대폰 로그인 화면의 로고를 2초 안에 10번, SC-62, `ReviewLoginSheet`): 6자리 코드 → `POST /v1/seller/auth/review-login`. 코드는 레포에 두지 않는다(서버 비밀값 `SELLER_REVIEW_LOGIN_CODE_SHA256`에 해시만). 들어가면 손님 목록에 보이지 않는 심사용 가게와 상태별 예시 주문
- **계정 찾기**: `/auth/login/find-account` - 계정 정보 찾기
- **Google 콜백**: `/auth/login/google` - Google OAuth 콜백
- **Kakao 콜백**: `/auth/login/kakao` - Kakao OAuth 콜백
- **이용약관**: `/terms/terms-of-service`
- **개인정보처리방침**: `/terms/privacy-policy`

### 마이페이지

- **마이페이지**: `/mypage` - 판매자 정보

### 스토어

- **스토어 등록**: `/store/create` - 3단계 마법사 기반 스토어 개설 플로우
- **스토어 홈**: `/stores/:storeId` - 스토어 대시보드
- **스토어 수정**: `/stores/:storeId/edit` - 스토어 정보 수정, 네이버 플레이스 연결·다시 불러오기
- **캘린더**: `/stores/:storeId/calendar` - 스토어 캘린더

### 상품

- **상품 목록**: `/stores/:storeId/products/list` - 상품 목록
- **상품 등록**: `/stores/:storeId/products/create` - 상품 등록
- **상품 상세**: `/stores/:storeId/products/:productId` - 상품 상세/수정

### 주문

- **주문 목록**: `/stores/:storeId/orders` - 주문 목록
- **주문 상세**: `/stores/:storeId/orders/:orderId` - 주문 상세

### 피드

- **피드 목록**: `/stores/:storeId/feed` - 피드 목록
- **피드 작성**: `/stores/:storeId/feed/create` - 피드 작성
- **피드 상세**: `/stores/:storeId/feed/:feedId` - 피드 상세

### 알림

- **알림 목록**: `/stores/:storeId/notifications` - 알림 목록
- **알림 설정**: `/stores/:storeId/notifications/settings` - 알림 설정

### 통계

- **주문 통계**: `/stores/:storeId/statistics/orders` - 매출/주문 통계

### 개발 서버

- **로컬 개발**: http://localhost:3002
- **스토리북**: http://localhost:6007
