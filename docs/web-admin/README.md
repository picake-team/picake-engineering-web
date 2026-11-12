# Picake Web Admin

Picake 플랫폼을 위한 React + Vite 기반 내부 관리자 시스템입니다. 소비자·판매자 앱의 콘텐츠와 회원을 관리하고, 통계를 조회하는 용도로 사용합니다.

## 🏗️ 주요 기능

### ✅ 구현 완료

- **인증 시스템**: 아이디/비밀번호 로그인 + TOTP(OTP 앱) 기반 2단계 인증
- **관리자 레이아웃**: 사이드바 기반 네비게이션 (`AdminLayout`, `AdminSidebar`)
- **통계**: 소비자 회원, 판매자 주문, 스토어, 입점 요청 통계 대시보드
- **관리자 계정 관리**: 관리자 계정 가입 요청 승인, 계정 목록, 설정
- **소비자 관리**: 회원 목록, 홈 배너, 공지사항, Q&A, 약관 관리
- **판매자 관리**: 회원(판매자) 목록, 스토어 목록, 판매자 세그먼트, 약관 관리
- **입점 요청 관리**: 비입점 카카오 장소에 대한 소비자 등록 요청 처리
- **견적 요청 관리**(기획 I-46, ① 2026-11-09·② 2026-11-12): 상태별 목록·상세. 상세 주소는 디스코드 새 요청 알림의 링크와 같다. 상세의 "물어볼 가게 · 견적"에서 가게 더하기(입점 가게는 판매자 앱으로 바로), 입점 전 가게 견적 링크 만들고 연락 문구 복사, 대신 적기, 손님이 입점 전 가게를 고르면 알림 문구 복사·"알렸어요", 요청 마감하기
- **채팅**(기획 I-11): 신고 처리(목록 24시간 기한, 상세에서 최근 대화 원문을 보고 고른 메시지 가리기, 상세 주소는 디스코드 신고 알림 링크와 같음)
- **상태 관리**: Zustand를 활용한 전역 상태 관리
- **API 통신**: TanStack Query + Axios를 활용한 서버 상태 관리
- **에러 처리**: Error Boundary 기반 에러 핸들링

## 🔗 주요 페이지

### 인증 관련

- **로그인**: `/auth/login`
- **회원가입(관리자 계정 요청)**: `/auth/register`
- **TOTP 설정**: `/auth/totp/setup`
- **TOTP 검증**: `/auth/totp/verify`

### 통계

- **회원 통계**: `/statistics/users`
- **주문 통계**: `/statistics/orders`
- **스토어 통계**: `/statistics/stores`
- **입점 요청 통계**: `/statistics/store-entry-requests`

### 관리자 계정 관리

- **가입 요청**: `/admin-management/requests`
- **계정 목록**: `/admin-management/accounts`
- **설정**: `/admin-management/settings`

### 소비자 앱 관리

- **회원 목록**: `/consumer/members`
- **견적 요청**: `/consumer/quote-requests`, 상세 `/consumer/quote-requests/:requestId`
- **채팅**: 신고 `/chat-reports`, 상세 `/chat-reports/:reportId`
- **홈 배너**: `/consumer/home-banners`
- **약관**: `/consumer/terms`
- **공지사항**: `/consumer/notices`
- **Q&A**: `/consumer/qnas`

### 판매자 앱 관리

- **회원(판매자) 목록**: `/seller/members`
- **스토어 목록**: `/seller/stores`
- **판매자 세그먼트**: `/seller/segments`
- **약관**: `/seller/terms`

### 개발 서버

- **로컬 개발**: http://localhost:3003
