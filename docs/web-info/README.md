# Picake Web Info

Picake의 정보·소개 사이트(`https://info.picakes.com`)입니다. 서비스 본체(`web-user`)와 분리된 정적 마케팅 페이지를 관리합니다. Next.js(App Router) 기반이고 Vercel에 배포합니다.

## 🔗 주요 페이지

| 경로            | 내용                                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`, `/seller`  | 페이지 없음(404). 리다이렉트하지 않으며, 고객·사장님 허브를 만들 때 채웁니다.                                                                            |
| `/seller/about` | 사장님 입점 소개 랜딩 (구 web-user `/partner/about`). 2026-11-14 다시 만듦: 견적 → 주문서 → 가게 링크 → 달력 → 조건 순서, 실제 판매자 화면과 케이크 사진 |
| `/robots.txt`   | 상용 환경만 허용, 검증·개발 환경은 전체 차단                                                                                                             |
| `/sitemap.xml`  | 상용 환경만 노출                                                                                                                                         |

## 🧭 설계 원칙

- **모바일 화면을 그대로 유지합니다.** web-user의 `RootWrapperLayout`과 같은 스크롤 컨테이너(`#root-scroll-container`)를 써서 모바일은 전체 폭, 640px 이상은 가운데 640px 열로 보입니다. PC 전용 레이아웃은 아직 없습니다.
- **web-user와 같은 구성을 따릅니다.** PostHog, 환경 판별(`NEXT_PUBLIC_NODE_ENV`), `robots`/`sitemap` 규칙이 web-user와 같습니다. 정적 소개 페이지라 Sentry는 쓰지 않습니다.
- **필요한 공용 코드만 복사해 씁니다.** 폰트 등은 web-user에서 복사한 것이며 web-user를 수정하지 않습니다. 원본이 바뀌어도 자동으로 따라가지 않습니다.
- **소개 페이지 그림은 실제 화면과 사진만 씁니다.** 판매자 화면 그림은 로컬 예시 가게(테스트 DB)로 찍은 것이고, 케이크 사진은 Unsplash 무료 사진입니다(`features/seller/assets`, 출처는 페이지 파일 주석). 그림·아이콘·빛번짐으로 꾸미지 않습니다(운영자가 "AI가 만든 느낌"이라고 함). 화면이 바뀌면 picake-hq skill `picake-marketing-image`의 스토어 스크린샷 방법으로 다시 찍습니다.
- **디자인 값은 web-user와 같이 씁니다.** 색·글자 크기·모서리·움직임은 공통 패키지 `@picake/design-tokens`의 손님 화면 preset입니다(`tailwind.config.ts`의 `presets`, 2026-11-08 복사본에서 바꿈). 패키지 값이 바뀌면 web-info도 따라 바뀝니다.
- **콘텐츠는 코드에 직접 작성합니다.** 문구를 고치려면 PR이 필요합니다.

## 📊 분석·모니터링

- PostHog는 web-user·web-seller와 **같은 프로젝트**를 쓰고, 이벤트에 `app: "web-info"`·`environment` 속성을 붙입니다. 기존 리포트·루틴은 `app` 필터를 걸고 있어 web-info 이벤트가 섞이지 않습니다.
- `info.picakes.com`과 `picakes.com`은 같은 상위 도메인이라 PostHog 방문자 식별자가 공유됩니다(`cross_subdomain_cookie` 기본값).
- 배포 결과는 다른 웹 앱과 같은 Discord 웹훅으로 가며, 알림 제목에 `web-info`가 표시됩니다.

## 🚀 개발·배포

```bash
yarn web-info:dev      # 개발 서버 (포트: 3004)
yarn web-info:build    # 빌드
yarn workspace @picake/web-info test   # CI 검사와 동일 (next build, 타입 검사 포함)
```

- 배포: `web-info/staging-*`, `web-info/production-*` 태그 푸시 → GitHub Actions → Vercel
- 도메인: 검증 `info-staging.picakes.com`, 상용 `info.picakes.com`
- 환경변수: `NEXT_PUBLIC_NODE_ENV`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

자세한 배포 설정은 [Vercel 배포 가이드](../infra/vercel/Vercel%20배포%20-%20가이드.md)를 참고하세요.

## ⚠️ 알아둘 점

- 오프라인 QR은 `https://picakes.com/partner`(web-user)를 가리킵니다. 이 주소와 `/partner/about` 리다이렉트는 web-user에서 관리하므로 함부로 없애지 마세요.
- 소개 페이지의 버튼 목적지(입점 신청 = 판매자 웹, 문의 = 카카오톡 채널 "픽케이크" 채팅)는 `common/constants/partner.constants.ts`에서 관리합니다. 2026-11-14부터 소개 페이지에는 설문 버튼이 없습니다(설문은 입점 안내 QR 페이지 `picakes.com/partner`에만).
