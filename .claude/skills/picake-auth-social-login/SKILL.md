---
name: picake-auth-social-login
description: Picake web-user/web-seller의 소셜 로그인(구글·카카오·애플 등 OAuth) 관련 기능을 새로 추가하거나 수정할 때 사용합니다. "애플 로그인 추가해줘", "소셜 로그인 provider 추가", "구글/카카오 로그인 수정" 같은 요청에 이 skill을 따르세요. 브릿지 없이 웹뷰에서 OAuth code flow로 처리하는 기존 패턴(프론트·백엔드·시크릿·탈퇴 처리)을 그대로 재사용합니다.
---

# 소셜 로그인(OAuth) 기능 구현

> **이 문서의 `apps/backend/...` 경로와 `deploy-*-backend-ec2.yml` 워크플로우는 별도 레포 [`picake-engineering-backend`](https://github.com/picake-team/picake-engineering-backend)의 것입니다.** 로컬에서는 이 레포의 형제 폴더(`../picake-engineering-backend`)에서 확인하세요. `apps/web-*` 경로는 이 레포입니다.

Picake는 구글·카카오 로그인을 **브릿지 없이 웹뷰에서 OAuth Authorization Code Flow**로 직접 처리합니다(iOS/Android 네이티브 SDK 연동 아님). 새 provider(예: Apple)를 추가하거나 기존 provider를 수정할 때는 아래 구조를 그대로 따릅니다 — 임의로 다른 패턴을 만들지 않습니다.

## 0. 전체 구조

- **web-user(소비자) / web-seller(판매자)는 완전히 분리**된 계정·OAuth 앱입니다. 구글은 `GOOGLE_CLIENT_ID`(소비자)와 `GOOGLE_CLIENT_ID_SELLER`(판매자)가 별도로 존재합니다. 카카오는 컨슈머/셀러 앱이 있지만 시크릿은 공용(`KAKAO_CLIENT_ID`)입니다 — provider마다 분리 여부가 다르니 새 provider 작업 전 어느 쪽인지 먼저 확인하세요.
- 프론트가 `window.location.origin` 기반 **동일 도메인 redirect_uri**를 만들기 때문에 dev/staging/prod 각 도메인을 provider 콘솔(또는 Apple Services ID)에 전부 등록해야 합니다.
- 신규 가입 시 소셜 로그인만으로는 부족하고 **휴대폰 인증이 필수**입니다(로그인 시도 → 미가입/휴대폰 미인증이면 `PHONE_VERIFICATION_REQUIRED` 반환 → 회원가입 화면으로 분기 → 인증 후 등록).

## 1. 프론트엔드 (`apps/web-user/src`) — provider 하나 추가 시 건드릴 파일

| 파일                                                                                                          | 역할                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `common/constants/paths.constant.ts`                                                                          | `PATHS.AUTH.{PROVIDER}_REDIRECT_URI`, `{PROVIDER}_REGISTER` 경로 상수                                                                                                                                   |
| `features/auth/utils/oauth-login-url.util.ts`                                                                 | `get{Provider}OAuthLoginUrl()` — 클라이언트에서 authorize URL 조립. `redirect_uri = ${window.location.origin}${PATH}`                                                                                   |
| `common/components/buttons/oauth-provider-login-buttons.tsx`                                                  | provider별 버튼 스타일(카카오: 노랑 배경, 구글: 흰 배경+테두리) — 같은 톤(52px 높이, `rounded-2lg`, `text-base font-bold`)으로 새 버튼 추가                                                             |
| `features/auth/components/LoginBottomSheet.tsx`                                                               | 로그인 바텀시트에 버튼 노출, `useEffect`로 auth URL 세팅, `trackEvent("engage_social_select", { provider })`                                                                                            |
| `app/auth/login/{provider}/page.tsx`                                                                          | OAuth 콜백 페이지. `code` 쿼리 파싱 → `authApi.{provider}Login(code)` 호출 → 성공 시 `login(accessToken)` + `PATHS.HOME`, `PHONE_VERIFICATION_REQUIRED`면 id/email을 쿼리로 붙여 register 페이지로 이동 |
| `app/auth/register/{provider}/page.tsx` + `features/auth/components/{Provider}RegisterVerificationScreen.tsx` | 휴대폰 인증 → 약관 동의 → `use{Provider}Register` 뮤테이션으로 가입                                                                                                                                     |
| `features/auth/apis/auth.api.ts`                                                                              | `{provider}Login`, `{provider}Register` — `consumerClient.post("/auth/{provider}/login" \| "/register", ...)`                                                                                           |
| `features/auth/types/auth.dto.ts`                                                                             | `{Provider}LoginRequestDto`, `{Provider}RegisterRequestDto`                                                                                                                                             |
| `features/auth/hooks/mutations/useAuthMutation.ts`                                                            | `use{Provider}Register` — 성공 시 로그인+홈이동+`trackEvent("success_signup")`, 실패 시 `parseDuplicateAccountPayload`로 중복계정 분기                                                                  |
| `features/auth/utils/social-auth-error.util.ts`, `register-duplicate-account.util.ts`                         | 에러 사유 판별(`resolveSocialAuthFailReason`), 중복계정 에러 파싱 — provider 무관 공통 유틸이라 그대로 재사용                                                                                           |

analytics 이벤트는 `request_social_auth` / `success_login` / `fail_social_auth` / `engage_social_select` / `success_signup`에 `provider` 필드로 구분해서 기록합니다. 새 provider도 동일 이벤트명에 `provider: "apple"`처럼 값만 추가합니다.

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
7. **실제 API로 가입까지 검증** — Apple/Google처럼 code 교환이 외부 provider에 의존하는 provider는 로그인 전체를 로컬에서 재현할 수 없지만, 가입(`/register`) 이후 로직은 curl로 완전히 검증 가능합니다: `send-verification-code` → `verify-phone-code`(dev 환경 전용 우회 인증번호 `777777` — `auth-phone.service.ts` 참고, 실제 SMS 발송 없이 통과됨) → `{provider}/register`. 응답의 `accessToken`으로 `mypage/profile`까지 호출해 새 필드가 제대로 나오는지 확인하세요. 테스트로 만든 데이터는 끝나면 지우세요.
8. `docs-sync` 스킬 흐름대로 관련 문서 갱신

## 5. Apple 로그인 — 확정된 결정 사항 (2026-08 기준)

- **범위: web-user(소비자)만.** web-seller는 이번 대상 아님 — `Seller` 테이블/셀러 컨트롤러는 건드리지 않습니다. Google처럼 seller용 별도 Client 분리 불필요.
- **환경: dev는 별도 지원 안 함, staging 도메인으로 대체.** Apple Services ID의 Return URL은 HTTPS 도메인만 등록 가능해 `localhost`를 쓸 수 없습니다. 그래서 dev(로컬)에서도 Apple 버튼의 redirect_uri는 항상 `https://staging.picakes.com`으로 고정합니다 — 즉 dev에서 Apple 로그인을 누르면 실제 콜백 처리는 **스테이징에 배포된 프론트/백엔드가 담당**합니다(로컬로 돌아오지 않음). 별도 "dev용 Return URL"을 Apple에 등록할 필요가 없습니다.
- **등록된 자격 정보** (Apple Developer 계정 소유, dev/staging/prod 구분 없이 공용 — Kakao의 `KAKAO_CLIENT_ID`/Firebase의 `FIREBASE_PRIVATE_KEY`와 동일한 "환경 무관 공용 시크릿" 패턴):
  - Services ID(=client_id): `com.product.picake.web`
  - Primary App ID: `com.product.picake`
  - Team ID: `S5AJRJ2DLR`
  - Key ID: `MVGV5R9ZTY`
  - `.p8` private key — **값 자체는 절대 코드/문서/커밋에 남기지 않는다.** GitHub Secrets에만 등록.
  - Return URL: production(`https://picakes.com/auth/login/apple`)은 등록 완료, staging(`https://staging.picakes.com/auth/login/apple`)은 앱담당자에게 추가 등록 요청 필요.
  - `aud` 검증: `com.product.picake`(네이티브) / `com.product.picake.web`(웹) 두 값 모두 허용하기로 결정.

### 필요한 환경변수 — 정확히 이것만 추가

**백엔드 GitHub Actions Secrets** (`deploy-staging-backend-ec2.yml`, `deploy-production-backend-ec2.yml` 둘 다에 동일 값으로 매핑 — Kakao 시크릿처럼 `STAGING_`/`PRODUCTION_` 접두어 없이 공용 1세트):

| Secret              | 값                                                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `APPLE_TEAM_ID`     | `S5AJRJ2DLR`                                                                                                                                                                                                 |
| `APPLE_KEY_ID`      | `MVGV5R9ZTY`                                                                                                                                                                                                 |
| `APPLE_PRIVATE_KEY` | `.p8` 파일 내용. `FIREBASE_PRIVATE_KEY`와 동일하게 개행을 `\n`으로 이스케이프해 한 줄로 저장하고, 코드에서 `privateKey.replace(/\\n/g, "\n")`로 복원 (`apps/backend/src/modules/fcm/fcm.service.ts:49` 참고) |
| `APPLE_CLIENT_ID`   | `com.product.picake.web` (Services ID)                                                                                                                                                                       |

| `APPLE_REFRESH_TOKEN_ENCRYPTION_KEY` | 32byte hex(64자) — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`로 1회 생성. 탈퇴 시 revoke용으로 저장하는 `refresh_token`을 AES-256-GCM으로 암호화하는 키(`TokenEncryptionUtil`) |

**redirect_uri용 신규 백엔드 env var는 만들지 않았습니다 — `PUBLIC_USER_DOMAIN` 재사용은 불가능했습니다.** 처음엔 재사용 가능하다고 판단했지만, dev의 `PUBLIC_USER_DOMAIN`이 `http://localhost:3001`이라 Apple Return URL(HTTPS 도메인만 허용)엔 못 씁니다. 대신 `auth.constants.ts`에 `getAppleRedirectBaseUrl(nodeEnv)`를 추가해 `NODE_ENV`로 직접 분기합니다(production만 `picakes.com`, 나머지는 `staging.picakes.com`) — web-user의 `getAppleAppSiteAssociation`(AASA)이 이미 쓰던 것과 동일한 패턴입니다. `auth-apple-oauth.service.ts` 생성자에서 이 값 + `OAUTH_REDIRECT_PATHS.APPLE`로 redirect_uri를 조립합니다.

**프론트(web-user) Vercel Environment Variables** (`web-user-staging`, `web-user-production` 프로젝트, 로컬은 `apps/web-user/.env.development`):

| 변수                          | 값                                                    |
| ----------------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_APPLE_CLIENT_ID` | `com.product.picake.web` — staging/production 동일 값 |

**⚠️ Vercel 대시보드 등록은 수동으로 해야 합니다.** 이 세션엔 Vercel 환경변수를 설정하는 MCP 도구/CLI가 없어서(Vercel CLI 미설치, `mcp__vercel__*`엔 env var set 도구가 없음) 로컬 `.env.development`·GitHub Secrets·워크플로만 자동 반영했고, `NEXT_PUBLIC_APPLE_CLIENT_ID`는 `web-user-staging`/`web-user-production` 두 프로젝트에 직접 추가해야 합니다.

프론트도 redirect base용 신규 env var 없이 `NODE_ENV` 분기 함수만 추가합니다(`oauth-login-url.util.ts`의 `getAppleRedirectBaseUrl()`, `environment.constants.ts`의 `NODE_ENV` 상수 재사용) — `getGoogleOAuthLoginUrl`/`getKakaoOAuthLoginUrl`처럼 `window.location.origin`을 쓰지 않는 것이 Apple만의 예외 포인트입니다.

### 구현 시 추가로 다른 점 (구글/카카오와 근본적으로 다른 부분)

- **`client_secret`이 고정 문자열이 아님**: 매 요청 직전 백엔드가 `APPLE_TEAM_ID`/`APPLE_KEY_ID`/`APPLE_PRIVATE_KEY`로 직접 서명하는 JWT(ES256, `aud: https://appleid.apple.com`, `sub: APPLE_CLIENT_ID`, 매 요청 재발급)입니다. `jsonwebtoken`(ES256 서명)과 `jwks-rsa`(Apple JWKS에서 id_token 검증용 공개키 조회)를 백엔드에 명시적 의존성으로 추가했습니다 — 둘 다 `@nestjs/jwt`/`firebase-admin`의 transitive dep으로 이미 node_modules엔 있었지만, 직접 import하려면 package.json에 명시해야 합니다.
- **`scope=name email` 요청** (2026-08-04 이전엔 `scope=email`만 요청했다가 변경): Google/Kakao 회원가입 화면처럼 이름을 직접 입력받게 하면 되니 처음엔 Apple의 `user`(이름, 최초 1회만 옴) 파라미터를 쓸 이유가 없다고 보고 범위를 최소화했으나, 이게 실제 App Store 심사 반려 사유였습니다(가이드라인 4 — "인증 프레임워크가 이미 제공한 이름을 다시 입력하도록 요구함", [[picake-review-ios-app-store]] skill 참고). 지금은 `route.ts`가 form_post 바디의 `user` JSON을 파싱(`extractAppleDisplayName`)해 `appleName` 쿼리로 콜백→회원가입 화면까지 전달해 "이름" 필드를 미리 채웁니다. `user`는 **최초 인가 1회에만** 오므로, 이미 한 번 인가한 계정으로 재가입 플로우를 테스트하면(예: Apple ID 설정에서 연결 해제 전) 이름이 안 채워지는 게 정상입니다 — 버그로 오인하지 마세요.
- **`response_mode=form_post` 강제**: `scope`를 요청하면 Apple은 인가 응답을 GET 쿼리가 아니라 Return URL로 **POST**(form-urlencoded)로 보냅니다. 그래서 `/auth/login/apple`은 페이지가 아니라 **route.ts(POST 핸들러)**가 받고, `code`(또는 `error`)만 꺼내 클라이언트 콜백 페이지로 303 리다이렉트합니다. 실제 파일 구조:
  - `app/auth/login/apple/route.ts` — POST 핸들러, `request.formData()`로 `code`/`error` 파싱 → `/auth/login/apple/callback?code=...`로 303 리다이렉트
  - `app/auth/login/apple/callback/page.tsx` — Google `app/auth/login/google/page.tsx`와 동일한 클라이언트 콜백 로직(쿼리의 `code`로 `authApi.appleLogin` 호출)
  - `app/auth/register/apple/page.tsx` + `AppleRegisterVerificationScreen.tsx` — Google 회원가입 화면과 동일 구조
- **id_token 검증**: Google처럼 access_token으로 별도 userinfo API를 호출하는 게 아니라, 토큰 교환 응답에 함께 오는 `id_token`(JWT)을 Apple JWKS(`https://appleid.apple.com/auth/keys`, RS256)로 검증해서 `sub`/`email`을 바로 추출합니다(`auth-apple-oauth.service.ts`의 `verifyIdToken`).
- **탈퇴 시 revoke 필수(Apple 가이드라인 5.1.1(v))**: 로그인·가입 성공 시마다 `refresh_token`을 `TokenEncryptionUtil`(AES-256-GCM, `apps/backend/src/common/utils/token-encryption.util.ts`)로 암호화해 `Consumer.appleRefreshToken`에 저장해두고, 탈퇴 시점에 복호화해 `POST https://appleid.apple.com/auth/revoke`를 호출합니다(`AuthAppleOauthService.revokeToken`, `AuthWithdrawService`에서 호출). 구글/카카오는 탈퇴 시 provider 쪽 unlink를 호출하지 않지만 Apple만 예외입니다.
- `sub`는 Team ID + Primary App ID에 연결된 Services ID 기준으로, 동일 Apple 계정이면 네이티브 앱/웹 어느 경로로 로그인해도 같은 값이 나옵니다 — `Consumer.appleId` 컬럼 하나로 양쪽 겸용 가능합니다.

### DB(Prisma) — Apple은 Consumer 전용, `buildAnonymizedWithdrawalData` 공용 빌더에 넣지 말 것

`appleId`/`appleEmail`/`appleRefreshToken`은 `Consumer`에만 추가했고 `Seller`엔 없습니다(§0의 web-seller 미지원 결정). `auth-withdraw.service.ts`의 `buildAnonymizedWithdrawalData()`는 Consumer/Seller 탈퇴에서 **공용으로 재사용**되는 함수라, 여기에 `appleId: null` 등을 넣으면 `Seller.update()` 호출에서 존재하지 않는 컬럼이라 타입 에러가 납니다. Apple 필드는 `consumer.update({ data: { ...buildAnonymizedWithdrawalData(...), appleId: null, appleEmail: null, appleRefreshToken: null } })`처럼 **consumer 분기 호출부에서만** 스프레드로 추가하세요.

### 새 provider 추가 시 "표준 파일 목록"에 없는 숨은 지점 (반드시 grep으로 확인)

§1·§2의 표에 없는 곳에도 `"google" | "kakao"` 같은 provider 리터럴 유니온이 하드코딩돼 있어 새 provider를 놓치기 쉽습니다. 작업 전 `grep -rn '"google" | "kakao"' apps/backend/src apps/web-user/src`로 확인하세요. Apple 추가 때 실제로 발견된 지점:

- `apps/backend/src/modules/auth/types/auth.types.ts` — `AuthenticatedUser.loginType`
- `apps/backend/src/modules/auth/strategies/jwt.strategy.ts` — `validateConsumer()`의 `loginType`/`loginId` 도출 로직
- `apps/backend/src/modules/auth/services/auth-account-find.service.ts` — 계정 찾기(`findAccount`) consumer 분기의 반환 타입과 `if (row.kakaoId) / if (row.googleId)` 체인
- `apps/web-user/src/common/types/analytics.type.ts` — `OAuthProvider` (PostHog `trackEvent` provider 필드 타입)

### 이 저장소에서 npm install을 쓰면 안 됩니다

루트 `package.json`의 `packageManager`는 `yarn@4.9.4`(Berry)입니다. 의존성 추가 시 `npm install`을 쓰면 `yarn.lock`이 대규모로 깨지거나(수천 줄 diff) 불필요한 `package-lock.json`이 생성됩니다. 반드시 `corepack yarn workspace @picake/<앱> add <pkg>` (또는 `-D`)를 쓰세요. backend 의존성은 backend 레포에서 `corepack yarn workspace @picake/backend add <pkg>`를 씁니다.
