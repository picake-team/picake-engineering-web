# Picake Web Seller

Picake 플랫폼을 위한 React + Vite 기반 판매자 관리 시스템입니다. Shadcn/ui + Tailwind CSS와 최신 웹 기술을 활용하여 직관적이고 효율적인 판매자 경험을 제공합니다.

## 🏗️ 주요 기능

### ✅ 구현 완료

- **인증 시스템**: Google OAuth, Kakao OAuth, 계정 찾기
- **관리자 레이아웃**: 반응형 사이드바, 헤더, 네비게이션
- **사업자진위확인**: 국세청 API를 통한 사업자등록번호 진위확인
- **스토어 등록(3단계)**: 사업자 진위확인 → 통신판매사업자 등록상세 → 스토어 정보 입력 및 생성
- **스토어 관리**: 스토어 정보 수정, 홈 대시보드, 캘린더
- **네이버 플레이스 가져오기**: 스토어 등록·수정에서 네이버 링크로 이름·설명·연락처·인스타그램 ID를 골라 채우고 네이버 매장 연결·해제, 캘린더에서 네이버 영업시간으로 정기 휴무·표준 영업시간 채우기(`features/store/components/naver/`)
- **상품 관리**: 상품 목록, 등록, 상세/수정, 같은 스토어의 다른 상품에서 고시정보 복사(복사 뒤 확인 체크 필수)
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
