---
name: picake-auth-social-login
description: 소셜 로그인(구글·카카오·네이버·애플 OAuth)을 더하거나 고칠 때. "애플 로그인 추가", "카카오·구글·네이버 로그인 수정"에 쓴다. 웹뷰 OAuth code flow·시크릿·탈퇴 처리 패턴.
---

# 소셜 로그인(OAuth) 기능 구현

> **이 문서의 `apps/backend/...` 경로와 `deploy-*-backend-ec2.yml` 워크플로우는 별도 레포 [`picake-engineering-backend`](https://github.com/picake-team/picake-engineering-backend)의 것입니다.** 로컬에서는 이 레포의 형제 폴더(`../picake-engineering-backend`)에서 확인하세요. `apps/web-*` 경로는 이 레포입니다.

Picake는 구글·카카오 로그인을 **브릿지 없이 웹뷰에서 OAuth Authorization Code Flow**로 직접 처리합니다(iOS/Android 네이티브 SDK 연동 아님). 새 provider(예: Apple)를 추가하거나 기존 provider를 수정할 때는 아래 구조를 그대로 따릅니다 — 임의로 다른 패턴을 만들지 않습니다.

## 0. 전체 구조

- **web-user(소비자) / web-seller(판매자)는 완전히 분리**된 계정·OAuth 앱입니다. 구글은 `GOOGLE_CLIENT_ID`(소비자)와 `GOOGLE_CLIENT_ID_SELLER`(판매자)가 별도로 존재합니다. 카카오·네이버는 손님·사장님·staging·상용이 **앱 하나**를 같이 씁니다(카카오는 REST 키만 둘, 네이버는 Client ID 하나 — 같은 사람이면 회원 식별자가 같아 탈퇴 연결 끊기는 다른 역할 계정이 남아 있으면 하지 않음) — provider마다 분리 여부가 다르니 새 provider 작업 전 어느 쪽인지 먼저 확인하세요.
- 프론트가 `window.location.origin` 기반 **동일 도메인 redirect_uri**를 만들기 때문에 dev/staging/prod 각 도메인을 provider 콘솔(또는 Apple Services ID)에 전부 등록해야 합니다.
- 신규 가입에는 **확인된 휴대폰 번호가 필수**입니다(로그인 시도 → 미가입/휴대폰 미인증이면 `PHONE_VERIFICATION_REQUIRED` 반환 → 회원가입 화면으로 분기 → 등록). 구글·애플은 문자 인증, 카카오·네이버는 그 서비스가 준 번호(가입표 안)로 문자 없이 가입할 수 있고 "다른 번호"면 문자 인증입니다(2026-11-16, 아래 카카오·네이버 칸).
- **가입은 가입표(`registerToken`)로만 합니다(2026-11-16, 계정 보강 ②).** 로그인 API가 `PHONE_VERIFICATION_REQUIRED`를 줄 때 서버가 소셜 서비스에 직접 확인한 ID·이메일을 담은 30분짜리 JWT(`type: "register"`, `aud: consumer|seller`, `provider`)를 같이 줍니다(`JwtUtil.generateRegisterTicket`). 화면은 소셜 ID를 들고 다니지 않고 이 가입표만 회원가입 API에 보내며, 서버는 `JwtUtil.verifyRegisterTicket`으로 서명·만료·용도·대상·소셜 종류를 확인한 뒤 **가입표 안의 ID·이메일로만** 가입시킵니다. 전에는 가입 API가 화면이 보낸 `{provider}Id`를 그대로 믿어 남의 소셜 ID로 먼저 가입할 수 있었습니다. 가입표가 없거나 30분이 지나면 400 `REGISTER_TICKET_INVALID`("가입 시간이 지났어요. 다시 로그인해 주세요.") — 웹은 손님은 홈, 사장님은 로그인 화면으로 보내고 그 글을 띄웁니다. 새 provider도 이 방식을 따르세요(`buildRegisterRequiredError`·`verifyRegisterTicket`). 옮기는 동안 서버는 가입표 없는 옛 요청(`{provider}Id`)도 받았고, 웹이 바뀐 뒤 이 길을 막습니다.

### 카카오 한 번에 가입(카카오싱크, 기획 I-59 B, 2026-11-16)

- **서버**: 카카오 로그인에서 가입이 필요하면 사용자 정보의 `kakao_account.phone_number`(국내 휴대폰만 `010…`으로)·`name`과, 간편가입 약관 동의 내역(`GET https://kapi.kakao.com/v2/user/service_terms`, 이 대상 태그만)을 **가입표에 담는다**(`auth-kakao-oauth.service` `buildRegisterRequiredError`, `utils/kakao-signup.util`). 약관 조회가 실패하거나 모르는 응답이면 빈 목록 → 가입 화면이 지금처럼 약관을 받는다(응답 모양은 공식 문서에서 다 확인하지 못해 `service_terms[].{tag,agreed}`와 `allowed_service_terms[].tag` 둘 다 받음 — 실제 앱에서 간편가입을 켜면 실제 응답을 보고 고친다).
- **가입 API**(손님·사장님 카카오): `useTicketPhone: true`면 가입표의 카카오 번호로 **문자 인증 없이** 가입(화면이 보낸 `phone`은 무시), 아니면 지금처럼 `phone` + 문자 인증. 간편가입에서 이 대상의 필수 약관에 모두 동의했으면 화면 약관 체크 없이 가입하고 동의한 종류의 **지금 활성 버전**으로 동의 이력을 남긴다.
- **약관 태그**(`KAKAO_SERVICE_TERMS`): 손님 `picake_c_tos`·`picake_c_privacy`·`picake_c_third_party`(필수)·`picake_c_location`(선택), 사장님 `picake_s_tos`·`picake_s_privacy`. 손님·사장님이 **카카오 앱 하나(picake, REST 키만 둘)**를 같이 써서 동의 화면 설정이 앱 단위라, 로그인 요청에 `service_terms=`로 각자 태그만 보낸다(web `oauth-login-url.util`·seller `socialLogin.ts`·`Login.tsx`, 간편가입이 꺼진 동안 카카오가 무시해서 먼저 합침 — 11-16 테스트 앱 끝까지·실제 앱 로그인 화면까지 확인). 태그를 바꾸면 backend·web·카카오 콘솔 셋을 같이.
- **화면**: 가입표 안 값을 읽어(표시용 — 서명 확인은 서버) 카카오 번호를 기존 번호 칸 모양으로 **전체 번호**와 [다른 번호] 버튼으로 보여 주고(운영자 결정 11-16: 가리지 않음, 설명 글 없음), 이름을 미리 채우고, 카카오에서 필수 약관에 다 동의했으면 약관 칸만 뺀다(안내 글 없음). "다른 번호"를 누르면 문자 인증으로 가고 카카오 번호로 되돌아가는 버튼은 두지 않는다(다시 로그인). 카카오가 번호를 안 주면 화면은 예전 그대로. 손님 웹은 가입표를 주소 대신 **이 탭의 sessionStorage**로 넘기고(`register-ticket.util`, 받은 시각도 함께 — 30분 확인은 받은 뒤 지난 시간으로 세서 기기 시계가 틀려도 막지 않음), 로그인에 성공하면 남은 가입표를 지운다. 저장이 안 되는 브라우저만 주소로.
- **콘솔 상태·선행 조건**(2026-11-16): picake 앱은 비즈 앱(개인 개발자)·이메일 필수 동의. 전화번호·이름 항목은 "권한 없음"(추가 기능 신청 → 개인정보 동의항목 심사, 영업일 3~5일), 간편가입은 **비즈니스 채널 연결이 있어야 켜진다** — 개인 개발자 비즈 앱은 사업자 정보가 없어 비즈니스 채널을 연결할 수 없으니 사업자 정보 등록부터. 진행은 기획 I-59 진행 기록.
- **로컬 확인용 테스트 앱 `picake-TEST`**(원본 앱 아래, 오너 같음): 심사 없이 이름·전화번호 필수 동의, 로컬 리다이렉트 URI(`localhost:3001`·`3002` `/auth/login/kakao`), 간편가입 약관 6개 등록(채널 연결 전이라 꺼짐). 쓰는 법: 백엔드를 `KAKAO_CLIENT_ID`·`_SECRET`(+`_SELLER`)을 테스트 앱 값으로 덮어 띄우고, web-user `NEXT_PUBLIC_KAKAO_REST_API_KEY`·seller `VITE_PUBLIC_KAKAO_RESTAPI_KEY`도 테스트 앱 키로. 키·시크릿 값은 카카오 콘솔에서만 보고 레포·문서에 적지 않는다. 확인한 계정 데이터는 테스트 DB에서 지운다.

### 네이버 로그인 (손님·사장님, 2026-11-16)

- **앱 하나**: 네이버 개발자센터 앱 "픽케이크"를 손님·사장님·staging·상용·로컬이 같이 쓴다(카카오처럼). 같은 사람의 네이버 회원 식별자(`naverId`, 앱마다 다름)가 손님·사장님에서 같다. 받는 정보는 앱 설정에서 **회원이름·휴대전화번호(필수)**만 — 이메일은 받지 않는다(가입표 `email`은 빈 값, `verifyRegisterTicket`은 네이버만 빈 이메일 허용). Callback URL은 손님·사장님 × 상용·staging·로컬(`/auth/login/naver`) 전부 등록.
- **키**: 서버 `NAVER_CLIENT_ID`·`NAVER_CLIENT_SECRET`(GitHub 비밀값 공용 1세트, 사장님 앱을 나누면 `_SELLER`), 손님 웹 `NEXT_PUBLIC_NAVER_CLIENT_ID`, 사장님 웹 `VITE_PUBLIC_NAVER_CLIENT_ID`(Vercel). **웹은 키가 없으면 네이버 버튼을 숨긴다** — 네이버 검수 승인 전에는 상용 Vercel에 넣지 않는다(검수 전에는 테스터 아이디만 로그인돼서).
- **state**: 로그인 주소에 이 탭의 임의 값(`naver-oauth-state.util`, sessionStorage, 버튼이 여러 곳이어도 같은 값)을 붙이고, 콜백에서 같을 때만 서버에 `{ code, state }`를 보낸다(다르거나 없으면 서버를 부르지 않고 "로그인을 확인하지 못했어요"). 저장소를 아예 못 쓰는 브라우저도 막는다(확인할 수 없어서). 아직 통과하지 않은 값은 다시 쓰고(취소하고 다시 시도해도 통과) 통과한 값만 지운다. 30분은 주소를 마지막으로 만든 때부터 세고, 네이버 버튼은 누를 때 주소를 다시 만든다(손님 로그인 창·사장님 `refreshNaverHrefOnClick`) — 화면을 오래 띄워 둔 뒤 눌러도 막히지 않게(11-16 검토). PostHog 주소에서 `state`를 지운다. 서버는 토큰 발급에 state를 그대로 넘긴다(네이버 필수).
- **"이미 가입한 계정" 화면의 네이버 버튼**: `auth_type=reauthenticate`(손님 `getNaverOAuthLoginUrl({ reauthenticate: true })`, 사장님 `naverAuthorizeUrl({ reauthenticate: true })`·`refreshNaverReauthHrefOnClick`)로 네이버 아이디·비밀번호를 다시 받는다. 네이버 아이디가 둘인 사람이 지금 로그인된 다른 아이디로 그냥 넘어가 같은 화면으로 돌아오지 않게(구글은 모든 버튼이 `prompt=select_account`). 다른 네이버 버튼은 붙이지 않는다(로그인돼 있으면 바로 넘어가게, 11-18)
- **가입**: 카카오와 같은 화면(손님 `KakaoRegisterVerificationScreen`의 `NaverRegisterVerificationScreen`, 사장님 PC `KakaoAuthCallback`의 `NaverAuthCallbackPage`, 휴대폰 `OAuthCallback.mobile`) — 네이버 번호를 번호 칸 + [다른 번호]로 보여 주고 `useTicketPhone: true`면 문자 인증 없이 가입, "다른 번호"면 `naver_registration` 문자 인증. 네이버는 약관을 동의 화면에 넣을 수 없어 **약관 칸은 늘 보인다**.
- **탈퇴**: 로그인 때 받은 갱신 토큰을 `TokenEncryptionUtil`(애플과 같은 키)로 암호화해 가입표(`providerRefreshToken`)·계정(`naverRefreshToken`, 로그인마다 새로)에 저장 → 탈퇴 때 연결 끊기 = 네이버 "토큰 폐기"(2026-05 공식 명세, RFC 7009): `POST https://nid.naver.com/oauth2.0/revoke`에 `client_id`·`client_secret`·`token`(저장한 갱신 토큰)·`token_type_hint=refresh_token` — 짝인 접근 토큰도 같이 폐기되고 "연결된 서비스"에서 빠진다. 성공은 **HTTP 200**(본문 없음, 이미 폐기된 토큰도 200), 본문에 error·HTML이면 실패로 기록. 옛 `grant_type=delete`(11-16에 썼음)는 명세에서 빠졌고 가짜 키·토큰에도 `result: "success"`를 줘 쓰지 않는다(11-18 검토, 서버 고침). 명세는 GitHub `naver/naver-openapi-guide` `ko/login/devguide/devguide.md` 4.3(developers.naver.com은 AI 도구가 막힘). **상용(`NODE_ENV=production`)에서만** 끊고(staging도 같은 앱), 같은 네이버로 가입한 다른 역할 계정이 있으면 끊지 않는다. 실패해도 탈퇴는 진행.
- **앱 안 네이버 앱 로그인**: 네이버 로그인 화면의 "네이버 앱으로 로그인"은 `nidlogin://`(안드로이드)·`naversearchthirdlogin://`(iOS)를 연다 — 앱 껍데기 링크 규칙에 넣어야 앱 안에서 눌린다(앱 레포 `docs/bridge-contract.md`). 넣지 않아도 아이디·비밀번호 로그인은 된다.
- **로컬 확인**: 네이버 키 없이도 화면은 볼 수 있다 — 웹을 `NEXT_PUBLIC_NAVER_CLIENT_ID`(사장님 `VITE_PUBLIC_NAVER_CLIENT_ID`)에 아무 값으로 띄우고, 브라우저에서 `nid.naver.com`을 같은 state로 콜백에 돌려보내는 가짜 응답과 서버 `naver/login`의 가짜 400(가입표)을 걸면 가입(실제 로컬 서버)까지 끝까지 확인된다. 실제 네이버 로그인은 키를 넣은 뒤 등록자(운영자) 네이버 아이디로.

### 구글 이름 미리 채우기·번호 칸 자동완성 (2026-11-16)

- **구글 이름**: 서버가 구글 userinfo의 `name`(`scope=email profile`)을 `socialNameToDisplay`(앞뒤·겹친 공백 정리, 1~50자만, `utils/social-signup.util`)로 다듬어 가입표 `name`에 담는다. 손님 `GoogleRegisterVerificationScreen`·사장님 PC `GoogleAuthCallback`·사장님 휴대폰 `OAuthCallback.mobile`이 가입표에서 읽어 이름 칸을 채우고 고칠 수 있게 둔다(가입 API는 화면이 보낸 이름으로 가입). 구글은 실명을 확인하지 않아 영어 이름·별명도 올 수 있다. 애플은 지금처럼 `user` 폼 값(처음 인가 때만)으로 채운다.
- **번호 칸**: 사람 번호를 받는 칸은 `type="tel"` + `autoComplete="tel"` + `maxLength={PHONE_INPUT_MAX_LENGTH}`(20)로 두고, 값은 `toPhoneDigits`(숫자만·11자리, `+82`는 0으로)로 받는다(손님·사장님 각 `common/utils/phone-input.util`). 아이폰·크롬이 기기에 저장된 내 번호를 "010-1234-5678"이나 "+82 10-1234-5678"로 채우기 때문 — `maxLength={11}`이면 하이픈 든 값이 잘린다. 하이픈을 허용하는 칸(예약자 번호)은 `fromAutofillPhone`으로 국가번호 형식만 바꾼다.

## 1. 프론트엔드 (`apps/web-user/src`) — provider 하나 추가 시 건드릴 파일

| 파일                                                                                                          | 역할                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `common/constants/paths.constant.ts`                                                                          | `PATHS.AUTH.{PROVIDER}_REDIRECT_URI`, `{PROVIDER}_REGISTER` 경로 상수                                                                                                                                                                                                                                                                                                                                           |
| `features/auth/utils/oauth-login-url.util.ts`                                                                 | `get{Provider}OAuthLoginUrl()` — 클라이언트에서 authorize URL 조립. `redirect_uri = ${window.location.origin}${PATH}`                                                                                                                                                                                                                                                                                           |
| `common/components/buttons/oauth-provider-login-buttons.tsx`                                                  | provider별 버튼 스타일(카카오: 노랑 배경, 구글: 흰 배경+테두리) — 같은 톤(52px 높이, `rounded-2lg`, `text-base font-bold`)으로 새 버튼 추가                                                                                                                                                                                                                                                                     |
| `features/auth/components/LoginBottomSheet.tsx`, `app/auth/login/page.tsx`                                    | 버튼을 두는 **두 곳**: 로그인 바텀시트(`useEffect`로 auth URL 세팅)와 로그인 화면(로그인이 풀렸을 때 401·로그인 없이 예약 상세를 열 때 오는 곳). 새 provider 버튼은 두 곳에 같은 순서로 넣는다(2026-11-16 로그인 화면에 애플이 빠져 애플 가입 손님이 여기서 막혔던 것). `trackEvent("engage_social_select", { provider })`                                                                                      |
| `app/auth/login/{provider}/page.tsx`                                                                          | OAuth 콜백 페이지. `code` 쿼리 파싱 → `authApi.{provider}Login(code)` 호출 → 성공 시 `login(accessToken)` + `consumePostLoginRedirect()`(로그인 전에 보던 곳, 없으면 홈 — 애플 콜백 `apple/callback/page.tsx`도 같게, 11-16), `PHONE_VERIFICATION_REQUIRED`면 가입표 `registerToken`을 이 탭 sessionStorage에 두고(`register-ticket.util`, 저장이 안 되면 쿼리로) register 페이지로 이동(소셜 ID는 넘기지 않음) |
| `app/auth/register/{provider}/page.tsx` + `features/auth/components/{Provider}RegisterVerificationScreen.tsx` | 휴대폰 인증 → 약관 동의 → `use{Provider}Register` 뮤테이션으로 가입                                                                                                                                                                                                                                                                                                                                             |
| `features/auth/apis/auth.api.ts`                                                                              | `{provider}Login`, `{provider}Register` — `consumerClient.post("/auth/{provider}/login" \| "/register", ...)`                                                                                                                                                                                                                                                                                                   |
| `features/auth/types/auth.dto.ts`                                                                             | `{Provider}LoginRequestDto`, `{Provider}RegisterRequestDto`                                                                                                                                                                                                                                                                                                                                                     |
| `features/auth/hooks/mutations/useAuthMutation.ts`                                                            | `use{Provider}Register` — 성공 시 로그인+`consumePostLoginRedirect()`+`trackEvent("success_signup")`, 실패 시 `parseDuplicateAccountPayload`로 중복계정 분기                                                                                                                                                                                                                                                    |
| `features/auth/utils/social-auth-error.util.ts`, `register-duplicate-account.util.ts`                         | 에러 사유 판별(`resolveSocialAuthFailReason`), 중복계정 에러 파싱 — provider 무관 공통 유틸이라 그대로 재사용                                                                                                                                                                                                                                                                                                   |

로그인·가입이 끝나면 `saveLastLoginProvider(provider)`로 이 기기에 마지막 방법을 남기고(손님 `features/auth/utils/last-login-provider.util.ts`, 사장님 같은 이름), 로그인 화면이 그 버튼에 "최근 로그인" 말풍선을 띄웁니다. 새 provider·새 로그인 성공 지점을 만들면 여기도 부르고, 심사용 로그인은 부르지 않습니다. 탈퇴하면 `clearLastLoginProvider()`.

analytics 이벤트는 `request_social_auth` / `success_login` / `fail_social_auth` / `engage_social_select` / `success_signup`에 `provider` 필드로 구분해서 기록합니다. 새 provider도 동일 이벤트명에 `provider: "apple"`처럼 값만 추가합니다. 가입 이벤트(`request_signup`·`success_signup`)에는 `phone_source`(`kakao`·`naver`: 그 서비스가 준 번호로 문자 없이 / `sms`)와 `terms_source`(`kakao`: 카카오 간편가입 / `screen`)를 같이 보내고, `view_phone_verification`에는 카카오 `kakao_phone_offered`·네이버 `naver_phone_offered`를 붙입니다(기획 I-59·I-113).

## 2. 백엔드 (`apps/backend/src/modules/auth`)

| 파일                                                                    | 역할                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `services/auth-{provider}-oauth.service.ts`                             | consumer/seller 메서드 분리. `exchangeCodeForToken`에서 code→token 교환 시 **redirect_uri를 백엔드가 직접 재조립**(`PUBLIC_USER_DOMAIN`/`PUBLIC_SELLER_DOMAIN` + `OAUTH_REDIRECT_PATHS.{PROVIDER}`) — 프론트가 보낸 값이 아니라 서버가 다시 만든 값을 써야 하며 프론트와 **정확히 일치**해야 함. 로그인 시 계정 존재+`isActive`+휴대폰 인증 확인 후 JWT 발급, 없으면 `PHONE_VERIFICATION_REQUIRED` |
| `dto/auth-{provider}-oauth.dto.ts`                                      | 로그인/가입 요청 DTO                                                                                                                                                                                                                                                                                                                                                                               |
| `constants/auth.constants.ts`                                           | `OAUTH_REDIRECT_PATHS`에 provider 경로 추가, 관련 에러 메시지                                                                                                                                                                                                                                                                                                                                      |
| `types/auth.types.ts`                                                   | `{Provider}UserInfo` 타입                                                                                                                                                                                                                                                                                                                                                                          |
| `apis/consumer/controllers/auth.controller.ts` (+ seller 대응 컨트롤러) | `POST {provider}/login`, `POST {provider}/register` 라우트, Swagger 문서화                                                                                                                                                                                                                                                                                                                         |
| `auth.module.ts`                                                        | 신규 서비스 provider 등록                                                                                                                                                                                                                                                                                                                                                                          |
| `auth.service.ts`                                                       | 파사드 — 컨트롤러가 호출하는 위임 메서드 추가                                                                                                                                                                                                                                                                                                                                                      |

### DB (Prisma)

`Consumer`/`Seller` 모델에 `{provider}Id String? @unique @map("{provider}_id")`, `{provider}Email String? @map("{provider}_email")` 추가 + migration 생성. 기존 `googleId`/`kakaoId` 컬럼과 동일한 패턴을 따릅니다.

### 탈퇴 처리 — 절대 빠뜨리면 안 되는 부분

`services/auth-withdraw.service.ts`의 `buildAnonymizedWithdrawalData()`에 새 provider의 `{provider}Id: null, {provider}Email: null`을 반드시 추가하세요. 안 하면 탈퇴 후 동일 소셜 계정으로 재가입할 때 `@unique` 컬럼 충돌이 납니다.

### 마이페이지 프로필 응답 — 빠뜨리기 쉬운 지점 (Apple 추가 때 실제로 놓쳤던 버그)

`{provider}Id`/`{provider}Email`을 스키마·로그인·가입까지만 넣고 마이페이지 조회 응답에 빼먹기 쉽습니다. 아래 두 곳에 반드시 추가하세요 — 안 하면 로그인/가입은 정상 동작하는데 마이페이지에서 로그인 수단이 안 보이거나 빈 값으로 나옵니다.

- `dto/mypage-profile.dto.ts` — `MypageProfileBaseResponseDto`는 Consumer/Seller 공용이라 여기 넣으면 Seller 쪽에 없는 필드 참조로 깨질 수 있습니다. provider가 Consumer 전용이면(Apple처럼) `ConsumerMypageProfileResponseDto`에만 추가하세요.
- `utils/consumer-mapper.util.ts`(`ConsumerMapperUtil.mapConsumerToInfo`) — 반환 객체에 `{provider}Id`/`{provider}Email` 추가.
- 프론트 `features/mypage/types/profile.type.ts`(`MypageProfile`)와, 로그인 수단을 표시하는 화면들: `app/mypage/page.tsx`, `app/mypage/setting/page.tsx`(둘 다 동일한 `getLoginInfo` 함수가 중복 존재 — 같이 수정), `app/mypage/setting/account/page.tsx`(`getLoginProviderLabel`). 전부 `kakaoId → googleId → {provider}Id` 순으로 분기하는 동일 패턴입니다.

## 3. 환경변수·시크릿 (dev/staging/prod × consumer/seller)

- **프론트(Vercel)**: `NEXT_PUBLIC_{PROVIDER}_CLIENT_ID` — web-user/web-seller 프로젝트별, dev/staging/prod 환경별로 Vercel 대시보드에서 관리. 값은 문서에 기록하지 않음(`docs/infra/vercel/Vercel 배포 - 가이드.md` 참고).
- **백엔드(EC2, GitHub Actions Secrets)**: `.github/workflows/deploy-staging-backend-ec2.yml` / `deploy-production-backend-ec2.yml`에서 `{PROVIDER}_CLIENT_ID` / `{PROVIDER}_CLIENT_SECRET`(+ `_SELLER`)을 `secrets.STAGING_*` / `secrets.PRODUCTION_*`에 매핑. provider가 consumer/seller로 앱이 분리돼 있으면(구글처럼) 시크릿도 분리, 공용이면(카카오처럼) 하나만 둡니다.
- provider 콘솔(또는 Apple Services ID)에 **dev/staging/prod 각 도메인의 redirect_uri를 전부 등록**해야 합니다. 프론트가 `window.location.origin` 기반 동일 도메인 redirect_uri를 쓰기 때문입니다.

## 4. 신규 provider 추가 체크리스트 (순서)

1. provider 콘솔에서 앱/클라이언트 등록, redirect_uri(dev/staging/prod) 전부 등록
2. Vercel + GitHub Actions Secrets에 시크릿 반영 (2번 항목 참고)
3. Prisma 스키마에 `{provider}Id`/`{provider}Email` 추가 + migration + **로컬 dev DB에도 실제로 적용** — `db:migrate:dev`(=`prisma migrate dev`)가 기존 drift 때문에 막히면(다른 마이그레이션 파일이 적용 후 수정된 경우 등) `reset`을 유도하는데, 로컬 데이터를 지우고 싶지 않으면 `npx dotenv -e ./.env.development -- prisma migrate deploy --schema ./src/infra/database/prisma/schema.prisma`로 우회하세요 — drift 검사 없이 미적용 마이그레이션만 순서대로 적용해 데이터 손실이 없습니다. 마이그레이션을 로컬에 안 걸고 테스트하면 로그인/가입 API가 전부 "column does not exist" 500 에러로 실패합니다.
4. 백엔드: DTO → service(exchangeCodeForToken + login + register) → controller → module → auth.service 파사드
5. 백엔드: `auth-withdraw.service.ts`에 anonymize 필드 추가, `mypage-profile.dto.ts` + `consumer-mapper.util.ts`에 마이페이지 응답 필드 추가 (바로 위 섹션 참고)
6. 프론트: paths → oauth-login-url util → 버튼 컴포넌트 → LoginBottomSheet → 콜백 page → register page/screen → api/dto/mutation → 마이페이지 화면(`profile.type.ts` + `getLoginInfo`/`getLoginProviderLabel` 3곳)
7. **실제 API로 가입까지 검증** — Apple/Google처럼 code 교환이 외부 provider에 의존하는 provider는 로그인 전체를 로컬에서 재현할 수 없지만, 가입(`/register`) 이후 로직은 curl로 완전히 검증 가능합니다: `send-verification-code` → `verify-phone-code`(dev 환경 전용 우회 인증번호 `777777` — `auth-phone.service.ts` 참고, 실제 SMS 발송 없이 통과됨) → `{provider}/register`. 가입에는 가입표가 필요하니, 그 환경의 `JWT_SECRET`으로 `{ type: "register", aud, provider, providerId, email }`를 30분짜리로 서명하는 임시 스크립트로 만들어 쓰고 끝나면 지우세요. 응답의 `accessToken`으로 `mypage/profile`까지 호출해 새 필드가 제대로 나오는지 확인하세요. 테스트로 만든 데이터는 끝나면 지우세요.
8. `picake-docs-refresh` skill 흐름대로 관련 문서 갱신

## 5. Apple 로그인 — 확정된 결정 사항 (2026-08 기준)

- **범위: 손님(web-user, 2026-08)과 사장님(web-seller, 2026-11-26 — 판매자 앱 심사 4.8, 기획 I-48).** 같은 Services ID를 같이 써서 같은 애플 계정이면 `sub`(appleId)가 손님·사장님에서 같다 — 탈퇴 때 다른 쪽 계정이 남아 있으면 revoke하지 않는다(카카오·네이버와 같은 규칙).
  - **판매자 흐름**: `web-seller`는 Vite 정적 앱이라 Apple의 `form_post`를 받을 곳이 없어 **Return URL이 서버 주소** `https://api.picakes.com/v1/seller/auth/apple/callback`(상용)·`https://api-staging.picakes.com/v1/seller/auth/apple/callback`(그 밖 — 로컬도 staging)이다. 서버 `apple/callback`이 form_post를 받아 `code`·`state`·처음 한 번 오는 이름(`appleName`)만 `PUBLIC_SELLER_DOMAIN` + `/auth/login/apple`로 303 넘기고(돌아갈 곳은 서버 설정 하나, `utils/apple-signin.util`), 화면은 state(네이버와 같은 이 탭의 저장소)를 먼저 확인한 뒤 `apple/login`에 code를 보낸다. 서버는 토큰 교환 redirect_uri로 같은 서버 주소를 쓴다(`getSellerAppleRedirectUri` — 판매자 웹 `sellerAppleRedirectUri`와 글자까지 같아야 함). 가입은 구글처럼 문자 인증(`apple_registration`, audience seller).
  - **켜는 순서**: ① 앱담당자(계정 주인만)가 Services ID → Sign In with Apple Configure에 Domains `api.picakes.com`·`api-staging.picakes.com`, Return URL 위 둘을 저장(Continue → Save까지) ② 서버 상용 ③ Vercel 판매자 웹(staging·상용)에 `VITE_PUBLIC_APPLE_CLIENT_ID=com.product.picake.web`을 넣고 다시 배포 — 키가 없으면 버튼이 없어 웹이 먼저 나가도 깨지지 않는다(네이버와 같음). Return URL 저장 확인: `https://appleid.apple.com/auth/authorize?client_id=com.product.picake.web&redirect_uri=<주소>&response_type=code`가 약 131KB면 등록됨, 약 11KB면 "Invalid web redirect url"(2026-11-26).
- **환경: dev는 별도 지원 안 함, staging 도메인으로 대체.** Apple Services ID의 Return URL은 HTTPS 도메인만 등록 가능해 `localhost`를 쓸 수 없습니다. 그래서 dev(로컬)에서도 Apple 버튼의 redirect_uri는 항상 `https://staging.picakes.com`으로 고정합니다 — 즉 dev에서 Apple 로그인을 누르면 실제 콜백 처리는 **스테이징에 배포된 프론트/백엔드가 담당**합니다(로컬로 돌아오지 않음). 별도 "dev용 Return URL"을 Apple에 등록할 필요가 없습니다.
- **등록된 자격 정보** (Apple Developer 계정 소유, dev/staging/prod 구분 없이 공용 — Kakao의 `KAKAO_CLIENT_ID`/Firebase의 `FIREBASE_PRIVATE_KEY`와 동일한 "환경 무관 공용 시크릿" 패턴):
  - Services ID(=client_id): `com.product.picake.web`
  - Primary App ID: `com.product.picake`
  - Team ID: `S5AJRJ2DLR`
  - Key ID: `MVGV5R9ZTY`
  - `.p8` private key — **값 자체는 절대 코드/문서/커밋에 남기지 않는다.** GitHub Secrets에만 등록.
  - Return URL: production(`https://picakes.com/auth/login/apple`)·staging(`https://staging.picakes.com/auth/login/apple`) 모두 등록됨(2026-11-26 확인: Apple authorize가 정상 화면 약 131KB, 안 된 주소는 약 11KB 오류). 판매자 `https://api(-staging).picakes.com/v1/seller/auth/apple/callback`은 11-26 오후에도 아직 미저장(앱담당자가 Services ID에서 Continue → Save).
  - `aud` 검증: `com.product.picake`(네이티브) / `com.product.picake.web`(웹) 두 값 모두 허용하기로 결정.

### 필요한 환경변수 — 정확히 이것만 추가

**백엔드 GitHub Actions Secrets** (`deploy-staging-backend-ec2.yml`, `deploy-production-backend-ec2.yml` 둘 다에 동일 값으로 매핑 — Kakao 시크릿처럼 `STAGING_`/`PRODUCTION_` 접두어 없이 공용 1세트):

| Secret                               | 값                                                                                                                                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APPLE_TEAM_ID`                      | `S5AJRJ2DLR`                                                                                                                                                                                                   |
| `APPLE_KEY_ID`                       | `MVGV5R9ZTY`                                                                                                                                                                                                   |
| `APPLE_PRIVATE_KEY`                  | `.p8` 파일 내용. `FIREBASE_PRIVATE_KEY`와 동일하게 개행을 `\n`으로 이스케이프해 한 줄로 저장하고, 코드에서 `privateKey.replace(/\\n/g, "\n")`로 복원 (`apps/backend/src/modules/fcm/fcm.service.ts:49` 참고)   |
| `APPLE_CLIENT_ID`                    | `com.product.picake.web` (Services ID)                                                                                                                                                                         |
| `APPLE_REFRESH_TOKEN_ENCRYPTION_KEY` | 32byte hex(64자) — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`로 1회 생성. 탈퇴 시 revoke용으로 저장하는 `refresh_token`을 AES-256-GCM으로 암호화하는 키(`TokenEncryptionUtil`) |

**redirect_uri용 신규 백엔드 env var는 만들지 않았습니다 — `PUBLIC_USER_DOMAIN` 재사용은 불가능했습니다.** 처음엔 재사용 가능하다고 판단했지만, dev의 `PUBLIC_USER_DOMAIN`이 `http://localhost:3001`이라 Apple Return URL(HTTPS 도메인만 허용)엔 못 씁니다. 대신 `auth.constants.ts`에 `getAppleRedirectBaseUrl(nodeEnv)`를 추가해 `NODE_ENV`로 직접 분기합니다(production만 `picakes.com`, 나머지는 `staging.picakes.com`) — web-user의 `getAppleAppSiteAssociation`(AASA)이 이미 쓰던 것과 동일한 패턴입니다. `auth-apple-oauth.service.ts` 생성자에서 이 값 + `OAUTH_REDIRECT_PATHS.APPLE`로 redirect_uri를 조립합니다.

**프론트(web-user) Vercel Environment Variables** (`web-user-staging`, `web-user-production` 프로젝트, 로컬은 `apps/web-user/.env.development`):

| 변수                          | 값                                                    |
| ----------------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_APPLE_CLIENT_ID` | `com.product.picake.web` — staging/production 동일 값 |

**Vercel 두 프로젝트(`web-user-staging`/`web-user-production`)에도 넣어야 합니다**(대시보드 또는 Vercel MCP·CLI). 로컬 `.env.development`·GitHub Secrets·워크플로만 바꾸고 끝내면 배포된 화면에서 버튼이 동작하지 않습니다.

프론트도 redirect base용 신규 env var 없이 `NODE_ENV` 분기 함수만 추가합니다(`oauth-login-url.util.ts`의 `getAppleRedirectBaseUrl()`, `environment.constants.ts`의 `NODE_ENV` 상수 재사용) — `getGoogleOAuthLoginUrl`/`getKakaoOAuthLoginUrl`처럼 `window.location.origin`을 쓰지 않는 것이 Apple만의 예외 포인트입니다.

### 구현 시 추가로 다른 점 (구글/카카오와 근본적으로 다른 부분)

- **`client_secret`이 고정 문자열이 아님**: 매 요청 직전 백엔드가 `APPLE_TEAM_ID`/`APPLE_KEY_ID`/`APPLE_PRIVATE_KEY`로 직접 서명하는 JWT(ES256, `aud: https://appleid.apple.com`, `sub: APPLE_CLIENT_ID`, 매 요청 재발급)입니다. `jsonwebtoken`(ES256 서명)과 `jwks-rsa`(Apple JWKS에서 id_token 검증용 공개키 조회)를 백엔드에 명시적 의존성으로 추가했습니다 — 둘 다 `@nestjs/jwt`/`firebase-admin`의 transitive dep으로 이미 node_modules엔 있었지만, 직접 import하려면 package.json에 명시해야 합니다.
- **`scope=name email` 요청** (2026-08-04 이전엔 `scope=email`만 요청했다가 변경): Google/Kakao 회원가입 화면처럼 이름을 직접 입력받게 하면 되니 처음엔 Apple의 `user`(이름, 최초 1회만 옴) 파라미터를 쓸 이유가 없다고 보고 범위를 최소화했으나, 이게 실제 App Store 심사 반려 사유였습니다(가이드라인 4 — "인증 프레임워크가 이미 제공한 이름을 다시 입력하도록 요구함", [[picake-review-ios-app-store]] skill 참고). 지금은 `route.ts`가 form_post 바디의 `user` JSON을 파싱(`extractAppleDisplayName`)해 `appleName` 쿼리로 콜백→회원가입 화면까지 전달해 "이름" 필드를 미리 채웁니다. `user`는 **최초 인가 1회에만** 오므로, 이미 한 번 인가한 계정으로 재가입 플로우를 테스트하면(예: Apple ID 설정에서 연결 해제 전) 이름이 안 채워지는 게 정상입니다 — 버그로 오인하지 마세요.
- **`response_mode=form_post` 강제**: `scope`를 요청하면 Apple은 인가 응답을 GET 쿼리가 아니라 Return URL로 **POST**(form-urlencoded)로 보냅니다. 그래서 `/auth/login/apple`은 페이지가 아니라 **route.ts(POST 핸들러)**가 받고, `code`(또는 `error`)만 꺼내 클라이언트 콜백 페이지로 303 리다이렉트합니다. 실제 파일 구조:
  - `app/auth/login/apple/route.ts` — POST 핸들러, `request.formData()`로 `code`/`error` 파싱 → `/auth/login/apple/callback?code=...`로 303 리다이렉트
  - `app/auth/login/apple/callback/page.tsx` — Google `app/auth/login/google/page.tsx`와 동일한 클라이언트 콜백 로직(쿼리의 `code`로 `authApi.appleLogin` 호출)
  - `app/auth/register/apple/page.tsx` + `AppleRegisterVerificationScreen.tsx` — Google 회원가입 화면과 동일 구조
- **id_token 검증**: Google처럼 access_token으로 별도 userinfo API를 호출하는 게 아니라, 토큰 교환 응답에 함께 오는 `id_token`(JWT)을 Apple JWKS(`https://appleid.apple.com/auth/keys`, RS256)로 검증해서 `sub`/`email`을 바로 추출합니다(`auth-apple-oauth.service.ts`의 `verifyIdToken`).
- **탈퇴 시 revoke 필수(Apple 가이드라인 5.1.1(v))**: 로그인·가입 성공 시마다 `refresh_token`을 `TokenEncryptionUtil`(AES-256-GCM, `apps/backend/src/common/utils/token-encryption.util.ts`)로 암호화해 `Consumer.appleRefreshToken`에 저장해두고, 탈퇴 시점에 복호화해 `POST https://appleid.apple.com/auth/revoke`를 호출합니다(`AuthAppleOauthService.revokeToken`, `AuthWithdrawService`에서 호출). 구글은 탈퇴 시 provider 쪽 연결을 끊지 않고, 카카오(어드민 키로 unlink, 상용만)·네이버(접근 토큰 삭제, 상용만)는 2026-11-16부터 끊습니다 — 같은 앱을 쓰는 다른 역할 계정이 남아 있으면 끊지 않습니다(위 카카오·네이버 칸).
- `sub`는 Team ID + Primary App ID에 연결된 Services ID 기준으로, 동일 Apple 계정이면 네이티브 앱/웹 어느 경로로 로그인해도 같은 값이 나옵니다 — `Consumer.appleId` 컬럼 하나로 양쪽 겸용 가능합니다.

### DB(Prisma) — Apple 필드는 손님·사장님 둘 다(사장님 2026-11-26), 탈퇴 익명화는 분기마다

`appleId`/`appleEmail`/`appleRefreshToken`은 `Consumer`(2026-08)와 `Seller`(2026-11-26)에 있습니다. `auth-withdraw.service.ts`의 `buildAnonymizedWithdrawalData()` 공용 빌더에는 넣지 않고, 손님·사장님 분기의 `update({ data: { ...buildAnonymizedWithdrawalData(...), appleId: null, appleEmail: null, appleRefreshToken: null } })`에서 각각 비웁니다.

### 새 provider 추가 시 "표준 파일 목록"에 없는 숨은 지점 (반드시 grep으로 확인)

§1·§2의 표에 없는 곳에도 `"google" | "kakao"` 같은 provider 리터럴 유니온이 하드코딩돼 있어 새 provider를 놓치기 쉽습니다. 작업 전 `grep -rn '"google" | "kakao"' apps/backend/src apps/web-user/src`로 확인하세요. Apple 추가 때 실제로 발견된 지점:

- `apps/backend/src/modules/auth/types/auth.types.ts` — `AuthenticatedUser.loginType`
- `apps/backend/src/modules/auth/strategies/jwt.strategy.ts` — `validateConsumer()`의 `loginType`/`loginId` 도출 로직
- `apps/backend/src/modules/auth/services/auth-account-find.service.ts` — 계정 찾기(`findAccount`) consumer 분기의 반환 타입과 `if (row.kakaoId) / if (row.googleId)` 체인
- `apps/web-user/src/common/types/analytics.type.ts` — `OAuthProvider` (PostHog `trackEvent` provider 필드 타입)

### 이 저장소에서 npm install을 쓰면 안 됩니다

루트 `package.json`의 `packageManager`는 `yarn@4.9.4`(Berry)입니다. 의존성 추가 시 `npm install`을 쓰면 `yarn.lock`이 대규모로 깨지거나(수천 줄 diff) 불필요한 `package-lock.json`이 생성됩니다. 반드시 `corepack yarn workspace @picake/<앱> add <pkg>` (또는 `-D`)를 쓰세요. backend 의존성은 backend 레포에서 `corepack yarn workspace @picake/backend add <pkg>`를 씁니다.
