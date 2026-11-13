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
- **채팅(기획 I-11)**: 가게 상세 문의 창 "채팅으로 문의", MY 바로가기 "채팅"(안 읽은 수), 아래 MY 점. 관리자가 연 뒤에만 보임. 자세한 것은 `docs/common/feature/채팅 시스템 - 가이드.md`
- **알림**: FCM 푸시 알림 + 실시간 알림 목록
- **지도**: 위치 기반 스토어 검색 (Map)
- **검색**: 통합 검색 기능
- **Q&A**: 상품/스토어 문의
- **견적 요청**(기획 I-46, ① 2026-11-09·② 2026-11-12): 요청서 6단계(`/quote/new`, 쓰던 내용은 기기에 남아 로그인을 다녀와도 이어짐, 사진은 보낼 때 업로드), 보낸 뒤, 요청 상세(받은 견적·고르기, 고르면 그 가게 채팅으로), MY 내 견적 요청. 입점 전 가게는 운영자가 DM으로 보낸 견적 링크에서 가입 없이 견적을 보내고 손님과 대화한다(링크는 검색에 안 걸리고 PostHog·Sentry에서 열쇠를 지움, 미리보기는 사장님 문구). 입구는 홈 카드·검색 결과/스토어 상세 아래 칸·지도 미입점 카드·MY 바로가기. 동네·가게 찾기는 `app/api/kakao-local`(카카오 로컬, 키는 서버에만) 입점 가게 견적을 고르면 "이 견적으로 예약하기"(기획 I-01): 상품 예약 창과 같은 픽업 일시 → 주문확인(`QuoteReservationSheet`, 아래쪽은 공용 `ReservationContactAgreements`) → 예약 완료, 예약 상세에는 견적 카드(`QuoteOrderCard`).
- **상태 관리**: Zustand를 활용한 전역 상태 관리
- **API 통신**: TanStack Query + Axios를 활용한 서버 상태 관리
- **에러 처리**: Error Boundary, global-error, Sentry 연동
- **분석**: PostHog (환경 변수 설정 시). 이벤트 정의는 `common/types/analytics.type.ts`(기획팀 Data Taxonomy 시트와 같게), 모든 이벤트에 `app`·`environment`·`surface`(app = 손님 앱 웹뷰, web = 브라우저). 로그인하면 회원 번호로 사람을 묶고(`identify`, 이름·전화번호는 보내지 않음) 로그아웃하면 끊는다(`reset`, 2026-11-10~, 판매자 웹도 같음). 견적 요청서는 `view_quote_step` → `request_quote_request` → `success_quote_request`·`fail_quote_request`. 견적 ②(받은 견적·고르기)는 `view_quote_detail` → `engage_quote_chat`·`request_quote_choose` → `success_quote_choose`·`fail_quote_choose`, 사장님 견적 링크(`/q`, 로그인 없음)는 `view_quote_link` → `success_quote_link_submit`·`success_quote_link_decline`·`success_quote_link_chat`(판매자 앱은 `success_quote_send`·`success_quote_decline`). 채팅(I-11)은 `engage_chat_entry`(입구: 스토어 문의 창·예약에서 연 문의 창·MY) → `success_chat_message`(글 내용 없이 방·가게·처음인지·사진 수)
- **반응형 UI**: 모바일 우선 반응형 디자인 (Flutter WebView 환경 최적화)
- **디자인 기준**: 화면을 만들거나 고칠 때 [손님 앱 디자인 기준](손님%20앱%20디자인%20기준.md)(지금 있는 부품에 맞추기, 누름 효과·스크롤 자리 등 동작, 다시 꺼내지 않을 것)을 먼저 봅니다.
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
- **스토어 상세**: `/store/:storeId` - 스토어 홈 및 피드. 좋아요 옆 문의 아이콘 → "스토어 문의" 창(`StoreInquiryBottomSheet`, 사장님이 적은 카카오톡 채널 1:1 채팅·인스타·전화. 주문 화면 네 곳과 같은 창, `storeId`를 주면 가게 정보에서 불러옴). 바깥 링크는 `common/utils/external-link.util.ts`의 `openExternalUrl`(앱이면 `apps://`). 사장님이 보낸 링크(`?from=link`)로 가게·상품 화면이 열리면 기기 임의 값으로 방문을 남기고 가게를 30일 기억해, 그 가게 예약에 `entrySource: STORE_LINK`를 붙인다(`features/store/utils/store-link.util.ts`, 기획 I-45)

### 주문 / 예약

- **주문 목록**: `/mypage/order` - 주문 내역
- **주문 상세**: `/order/:orderId` - 주문 상세
- **예약 완료**: `/reservation/complete` - 예약 완료

### 견적 요청

- **요청서**: `/quote/new` - `?entry=HOME|SEARCH|MAP|STORE|MYPAGE`, 가게 화면에서는 `storeId`·`kakaoPlaceId`·`only=1`
- **보낸 뒤**: `/quote/sent?requestId=`
- **요청 상세**: `/quote/:requestId` - 카카오 알림톡 [견적 보기] 버튼에 고정된 주소라 바꾸지 않는다
- **내 견적 요청**: `/mypage/quote` - 진행 중 / 지난 요청
- **견적 링크(사장님)**: `/q/:token` - 입점 전 가게가 가입 없이 견적 보내기·고치기·어려워요·손님과 대화. 손님 앱 머리·아래 탭 없이 따로 그린다(`RootWrapperLayout`)

### 마이페이지

- **마이페이지**: `/mypage` - 사용자 정보
- **저장 목록**: `/saved`, `/mypage/saved` - 좋아요/저장 목록

### 커뮤니케이션

- **채팅**: `/chat`(목록), `/chat/:threadId`(방, 손님 앱 푸시 `data.path`와 같음), `/chat/store/:storeId`(가게에 처음 보내기)
- **알림**: `/alarm` - 알림 목록
- **Q&A**: `/qa` - 상품/스토어 문의

### 개발 서버

- **로컬 개발**: http://localhost:3001
