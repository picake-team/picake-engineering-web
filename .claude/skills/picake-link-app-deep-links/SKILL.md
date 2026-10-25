---
name: picake-link-app-deep-links
description: Picake web-user 도메인의 링크가 iOS/Android 네이티브 앱으로 바로 열리게(Universal Links / App Links) 설정하거나 수정할 때 사용합니다. "카카오 알림톡 버튼 iOS에서 앱으로 안 열려", "유니버설링크 설정해줘", "assetlinks/apple-app-site-association 수정" 같은 요청에 이 skill을 따르세요. SOLAPI 템플릿 등록 자체는 `picake-notify-kakao-template` skill을 쓰고, 이 skill은 그 템플릿 버튼 URL이 브라우저가 아니라 앱으로 열리게 하는 인프라만 다룹니다.
---

# 앱 딥링크(Universal Links / App Links) 설정

> **이 문서의 `apps/backend/...` 경로와 `deploy-*-backend-ec2.yml` 워크플로우는 별도 레포 [`picake-engineering-backend`](https://github.com/picake-team/picake-engineering-backend)의 것입니다.** 로컬에서는 이 레포의 형제 폴더(`../picake-engineering-backend`)에서 확인하세요. `apps/web-*` 경로는 이 레포입니다.

카카오 알림톡 버튼(`https://#{도메인}/order/...` 등)이나 그 외 `picakes.com` 링크를 눌렀을 때 브라우저가 아니라 네이티브 앱이 바로 열리게 하려면, 앱이 그 도메인의 소유권을 "신뢰 앵커 파일"로 검증해야 합니다. iOS는 Universal Links, Android는 App Links라는 별개 메커니즘이고 파일도 따로입니다 — 하나만 고치고 끝내지 않도록 주의하세요.

## 0. 전체 그림

- **신뢰 앵커 파일은 web-user가 서빙**하지만, **실제로 앱을 열리게 하는 설정(Associated Domains capability / intent-filter autoVerify)은 네이티브 앱 쪽**입니다. 네이티브 iOS/Android 앱은 이 모노레포(`apps/*`)에 없고 **별도 저장소**에 있습니다 — 이 skill로 web-user 쪽 파일을 다 맞게 고쳐도, 네이티브 앱 쪽에 Associated Domains/intent-filter가 없으면 여전히 브라우저로 열립니다. 앱담당자 확인이 필요한 부분은 명확히 구분해서 안내하세요.
- 딥링크로 열려야 하는 실제 경로 목록은 **백엔드 `USER_ORDER_ALIMTALK_BUTTON_URLS`**(`apps/backend/src/modules/notification/constants/user-order-alimtalk.constants.ts`)가 원본입니다. 새 버튼 URL이 추가되면 아래 파일들의 경로 목록도 같이 업데이트해야 합니다.

## 1. Android (App Links) — 이미 구성되어 있음, 참고용 패턴

| 파일                                                                 | 역할                                                                                                                                                                                                |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web-user/src/app/.well-known/assetlinks.json/route.ts`         | `getAndroidAssetLinks()`를 JSON으로 반환하는 route handler                                                                                                                                          |
| `apps/web-user/src/common/constants/android-asset-links.constant.ts` | 환경별(`ANDROID_ASSET_LINKS_BY_ENV`) `package_name` + `sha256_cert_fingerprints`. `NEXT_PUBLIC_NODE_ENV` 기준으로 분기(`getAndroidAssetLinks`), fingerprint가 비어 있으면 해당 환경은 응답에서 제외 |

- staging: `package_name: "com.pickage.package.staging"`
- production: `package_name: "com.pickage.package"`
- `sha256_cert_fingerprints`는 **Play Console의 App signing key certificate SHA-256**입니다(로컬 keystore 서명과 다를 수 있음 — Play App Signing 사용 시 Play Console이 재서명하기 때문). 앱담당자에게 요청할 때 "로컬 keystore 말고 Play Console → 앱 무결성 → 앱 서명 키 인증서"에서 받아달라고 명시하세요.
- Android App Links는 **도메인 전체를 신뢰**하고, 실제로 어떤 경로만 앱으로 열지는 네이티브 `AndroidManifest.xml`의 intent-filter(`autoVerify="true"`)에서 결정합니다 — `assetlinks.json` 자체엔 경로 화이트리스트가 없습니다(iOS와의 중요한 차이).

## 2. iOS — ⚠️ Universal Links는 비활성화 상태, 커스텀 스킴(`picake://`) 사용 중 (2026-08-03~)

**Universal Links를 켜지 마세요.** Universal Links로 앱이 열리면 웹뷰 네비게이션 직후(~1초) iOS가 자체적으로 앱을 백그라운드로 내리고 Safari를 다시 띄우는 현상이 실기기에서 확인됐습니다(앱담당자 진단: 카카오톡 인앱브라우저·메모 앱 등 진입 경로 무관하게 재현, 앱 쪽 코드엔 외부 브라우저를 여는 경로가 없음 확인 — iOS 자체 동작으로 판단, `restorationHandler` true 반환 등으로도 해결 안 됨). 그래서 iOS만 Universal Links를 끄고 커스텀 URL 스킴으로 전환했습니다. Android는 영향 없음(App Links 계속 정상 사용).

| 파일                                                                        | 역할                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web-user/src/app/.well-known/apple-app-site-association/route.ts`     | AASA를 JSON으로 반환하는 route(그대로 유지 — 파일 자체를 지우지 않음). **확장자 없는 파일 + `application/json` + 리다이렉트 없음이 필수**(Apple 사양)                                                                                                      |
| `apps/web-user/src/common/constants/ios-universal-links.constant.ts`        | `IOS_APP_ID_BY_ENV`를 **양쪽 다 빈 문자열**로 둬서 AASA가 `{ applinks: { details: [] } }`(appID 자체 미선언)를 반환하도록 함. `IOS_APP_ID`(Team ID+Bundle ID 값)와 `UNIVERSAL_LINK_COMPONENTS`(경로 목록)는 재활성화 대비용으로 코드에 남겨둠(현재 미사용) |
| `apps/web-user/src/common/components/deep-link/IosCustomSchemeRedirect.tsx` | 실제 딥링크 처리 담당. `useEffect`로 iOS UA 감지 후 `location.href = "picake://" + pathname.slice(1) + search`로 리다이렉트. **iframe 방식 금지**(iOS 사파리가 iframe에서 커스텀 스킴 호출을 차단) — 반드시 `location.href`                                |

**커스텀 스킴을 마운트한 곳** (경로가 하나라도 추가되면 여기도 같이 추가):

- `app/order/layout.tsx` — `/order/*` 전체(상세·취소 등) 커버
- `app/mypage/order/page.tsx` — `/mypage/order`
- `app/mypage/reviews/write/page.tsx` — `/mypage/reviews/write`

**iOS/Android가 근본적으로 다른 점(재활성화 시 참고)**:

- **`appID` 형식은 `{Apple Team ID}.{Bundle ID}`** 한 문자열입니다. Team ID는 [[picake-auth-social-login]] skill의 Apple Sign-In 작업 때 이미 받은 값과 **같은 Apple Developer 계정**이면 재사용 가능합니다 — `apps/backend/src/modules/auth/constants/auth.constants.ts`의 `APPLE_PRIMARY_APP_ID`(`com.product.picake`)와 `S5AJRJ2DLR`(Team ID, 코드에는 상수로 없고 GitHub Secrets `APPLE_TEAM_ID`에 있음).
- **Bundle ID는 스테이징/프로덕션 구분 없이 `com.product.picake` 하나만 씁니다(확정, 2026-08-02).** Android처럼 `.staging` 접미사로 분리된 값은 없습니다. 같은 Bundle ID를 쓰면 iOS 특성상(Bundle ID = 기기당 앱 설치 슬롯 하나) 기기에 설치된 빌드가 무엇이든 staging/production 도메인 링크를 누르면 전부 그 앱으로 열립니다 — Android처럼 두 환경 앱을 한 기기에 나란히 설치해서 따로 테스트할 수 없습니다.
- **`paths`(코드 상수명 `UNIVERSAL_LINK_COMPONENTS`)는 AASA에 직접 명시**해야 합니다 — Android처럼 네이티브 쪽에서 관리하지 않습니다.
- Sign in with Apple(Services ID 도메인 검증)과 이 AASA 파일은 **완전히 다른 용도**입니다 — 혼동해서 같이 지우지 마세요.

## 3. 배포 후 반드시 확인할 것 — 캐시로 인해 기존 사용자에게 즉시 반영 안 될 수 있음

AASA는 **앱 설치 시점에 iOS가 캐싱**합니다. 웹을 배포해도 이미 설치된 앱은 예전(Universal Links 켜진) AASA를 계속 들고 있을 수 있어, 앱 신규 설치/업데이트가 있어야 새 AASA(빈 값)를 다시 받아가 커스텀 스킴 경로로 전환됩니다. **기존 사용자에게 이 수정이 실제로 언제 반영되는지는 앱 쪽 배포(신규 빌드 배포 여부/시점)에 달려있으므로, 앱담당자에게 롤아웃 계획을 확인하세요.**

## 4. 새 딥링크 경로 추가 시 체크리스트

1. `apps/backend/.../user-order-alimtalk.constants.ts`에 버튼 URL 추가(경로가 새로 생기는 경우)
2. iOS: `UNIVERSAL_LINK_COMPONENTS`는 현재 미사용이라 급하지 않지만, `IosCustomSchemeRedirect`를 새 경로의 페이지/레이아웃에도 마운트해야 실제로 동작합니다.
3. Android는 이 저장소에서 할 일 없음(네이티브 AndroidManifest 쪽) — 앱담당자에게 intent-filter 갱신 필요 여부 확인
4. 배포 후 `curl https://staging.picakes.com/.well-known/apple-app-site-association`, `curl https://staging.picakes.com/.well-known/assetlinks.json`로 실제 응답에 반영됐는지 직접 확인 — `NEXT_PUBLIC_*` 값이 아니라 서버 컴포넌트/route handler가 만드는 JSON이라 브라우저 캐시 문제만 없으면 즉시 반영됩니다.
5. 네이티브 앱(별도 저장소)에 Associated Domains(iOS)/intent-filter autoVerify(Android)가 살아있는지는 이 저장소 범위 밖 — 앱담당자 확인 필요.
