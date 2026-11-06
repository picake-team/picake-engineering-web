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
- **채팅**: Socket.IO 기반 실시간 채팅 (준비 중)
- **마이페이지**: 판매자 정보 조회/수정
- **상태 관리**: Zustand를 활용한 전역 상태 관리
- **API 통신**: TanStack Query + Axios를 활용한 서버 상태 관리
- **에러 처리**: Error Boundary와 Sentry 연동
- **디자인 시스템**: Shadcn/ui + Tailwind CSS (Material-UI에서 마이그레이션 완료)

### 🔄 개발 중

- 채팅 시스템 활성화
- 재고 관리
- **휴대폰 화면(판매자 앱 "픽케이크 사장님", 기획 I-48)**: 같은 주소에 휴대폰 화면을 더하는 중. 개발·staging에서 폭 767px 이하일 때만 보이고 production은 지금 PC 화면만(`common/constants/screen.constant.ts`). 부품은 `common/ui/`(디자인 기준 B, Storybook "판매자 앱/부품"), 구조는 [프로젝트 구조 가이드](../common/structure/프로젝트%20구조%20-%20가이드.md#판매자-웹의-휴대폰-화면-2026-11-06-판매자-앱-i-48)
  - 만든 화면: 홈(`/stores/:storeId`, 주간 달력·처리할 주문·고른 날 픽업·이번 주 매출·첫 상품 안내), 주문 목록(`/orders`, 처리할 것·진행 중·지난 주문 탭과 할 일 칸, 찾기·상태 안내·목록에서 바로 처리, `?tab=&group=&q=`), 주문 상세(`/orders/:orderId`, 단계·할 일 한 줄·입금 마감·처리 창·전화·문자·복사), 알림 목록(`/notifications`), 스토어 탭(`/stores/:storeId/menu`, 링크 보내기·스토어 바꾸기). 아직 없는 화면은 휴대폰 폭에서도 PC 화면
  - 캘린더(`/calendar`, 달력 하나·점·휴무·바꿈), 날짜 영업(`/calendar/:dateKey`, 그날만 정상영업·휴무·시간, 겹친 예약 안내), 영업시간(`/hours`, 쉬는 요일·30분 간격 시각·네이버 영업시간으로 채우기), 주문 통계(`/statistics/orders`, 기간 빠른 선택·잘 팔린 상품·요일/시간대 접기), 알림 설정(`/notifications/settings`, 주문 알림 끌 때 확인·아침 요약·테스트 알림), 마이페이지(`/mypage`, 프로필 수정 창·계정 정보·로그아웃 창), 휴대폰 번호 변경(`/mypage/phone`), 회원 탈퇴(`/mypage/withdraw`, 진행 중 주문 미리 안내). 날짜 영업·영업시간·휴대폰 번호 변경·탈퇴 주소는 PC 폭에서 캘린더·마이페이지로
  - 상품 목록(`/products`, 검색·정렬과 거르기 창·전체/판매중/판매중지/숨김·판매 상태 바로 바꾸기와 되돌리기). 상품 등록·수정, 피드, 스토어 정보는 아직 휴대폰 디자인으로 다시 그리지 않아 지금 PC 화면을 휴대폰 틀(`MobileFrame`, 뒤로 + 제목)에 담아 쓴다
  - 실시간 알림(소켓)이 오면 주문 목록·홈 숫자도 새로 불러오고, 이 화면에서 방금 바꾼 주문의 알림 띠는 겹쳐 띄우지 않음(`recent-order-change.util.ts`)

## 🔗 주요 페이지

### 인증 관련

- **로그인**: `/auth/login` - Google/Kakao 소셜 로그인
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
