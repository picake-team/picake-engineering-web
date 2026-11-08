# Picake Web User

Picake 플랫폼을 위한 Next.js 기반 사용자 웹 애플리케이션입니다. React 19와 최신 웹 기술을 활용하여 최적화된 사용자 경험을 제공합니다.

## 🏗️ 주요 기능

### ✅ 구현 완료

- **인증 시스템**: Flutter WebView 연동 + Google/Kakao/Apple OAuth 콜백 + 앱스토어 심사용 로그인
- **iOS 딥링크**: 커스텀 스킴(`picake://`)으로 앱 열기 (유니버설 링크는 비활성화)
- **홈 / 탐색**: 상품 목록, 배너 슬라이더, 카테고리 필터, 검색, 지역 기반 필터링
- **상품**: 상품 목록, 상세 페이지, 줌/핀치 이미지 뷰어 (react-zoom-pan-pinch)
- **스토어**: 스토어 상세 페이지, 스토어 피드
- **주문**: 주문 생성, 주문 목록, 주문 상세, 예약
- **리뷰**: 리뷰 작성 및 조회
- **좋아요 / 저장**: 좋아요 추가/제거, 저장 목록 (Saved)
- **마이페이지**: 사용자 정보 조회/수정, 주문 내역
- **채팅**: Socket.IO 기반 (현재 `/chat` 경로는 홈으로 리다이렉트)
- **알림**: FCM 푸시 알림 + 실시간 알림 목록
- **지도**: 위치 기반 스토어 검색 (Map)
- **검색**: 통합 검색 기능
- **Q&A**: 상품/스토어 문의
- **상태 관리**: Zustand를 활용한 전역 상태 관리
- **API 통신**: TanStack Query + Axios를 활용한 서버 상태 관리
- **에러 처리**: Error Boundary, global-error, Sentry 연동
- **분석**: PostHog (환경 변수 설정 시)
- **반응형 UI**: 모바일 우선 반응형 디자인 (Flutter WebView 환경 최적화)
- **디자인 값**: 색·글자 크기·모서리·움직임은 공통 패키지 `@picake/design-tokens`의 손님 화면 preset(web-info와 같이 씀, `tailwind.config.ts`의 `presets`). 값과 tailwind 이름은 Storybook "Common/디자인 값"(`yarn web-user:storybook`)에서 보고, 새 화면은 숫자·색 코드를 클래스에 직접 쓰지 않고 이 이름을 씁니다([공통 디자인 값](../common/structure/프로젝트%20구조%20-%20가이드.md#공통-디자인-값-packagesdesign-tokens-2026-11-08))
- **SEO 최적화**: Next.js 메타데이터 API 활용

### 🔄 개발 중

- 결제 시스템

## 🔗 주요 페이지

### 홈 / 탐색

- **홈페이지**: `/` - 메인 페이지 (상품 목록, 배너, 카테고리)
- **검색**: `/search` - 통합 검색
- **지도**: `/map` - 지역 기반 스토어 지도 검색

### 인증 관련 (OAuth 콜백)

- **Google 로그인 콜백**: `/auth/login/google`
- **Kakao 로그인 콜백**: `/auth/login/kakao`
- **Apple 로그인 콜백**: `/auth/login/apple`, `/auth/login/apple/callback`
- **Google 회원가입 콜백**: `/auth/register/google`
- **Kakao 회원가입 콜백**: `/auth/register/kakao`
- **Apple 회원가입**: `/auth/register/apple`

> 로그인·회원가입은 앱에서도 web-user(웹뷰 안)가 처리합니다. Flutter 앱은 토큰을 따로 보관하지 않고 푸시 토큰·위치만 주고받습니다([사용자 - 웹뷰 인증 가이드](../common/feature/사용자%20-%20웹뷰%20인증.md)). Apple 로그인의 dev 환경은 별도 지원 없이 staging 도메인으로 대체됩니다.
> 앱스토어 심사용 로그인(`review-login`)은 심사관 계정으로 로그인해야 하는 요구사항에 대응하기 위한 별도 플로우입니다.

### 상품 / 스토어

- **상품 상세**: `/product/:productId` - 상품 상세 페이지
- **스토어 상세**: `/store/:storeId` - 스토어 홈 및 피드

### 주문 / 예약

- **주문 목록**: `/mypage/order` - 주문 내역
- **주문 상세**: `/order/:orderId` - 주문 상세
- **예약 완료**: `/reservation/complete` - 예약 완료

### 마이페이지

- **마이페이지**: `/mypage` - 사용자 정보
- **저장 목록**: `/saved`, `/mypage/saved` - 좋아요/저장 목록

### 커뮤니케이션

- **채팅**: `/chat` - 현재 홈(`/`)으로 리다이렉트
- **알림**: `/alarm` - 알림 목록
- **Q&A**: `/qa` - 상품/스토어 문의

### 개발 서버

- **로컬 개발**: http://localhost:3001
