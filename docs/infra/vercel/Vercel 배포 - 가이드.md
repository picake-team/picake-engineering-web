# Vercel 배포 가이드

## 개요

Picake 프로젝트의 web-user, web-seller, web-admin, web-info 애플리케이션을 Vercel에 배포하고 관리하는 가이드입니다.

## Vercel을 선택한 이유

### 1. Next.js 최적화

- Next.js 프레임워크에 특화된 배포 플랫폼
- 자동 최적화 및 성능 향상
- Edge Network를 통한 글로벌 CDN

### 2. 개발자 경험

- GitHub 연동을 통한 자동 배포
- 간단한 설정과 빠른 배포

### 3. 비용 효율성

- 무료 티어 제공
- 사용량 기반 과금

## 주요 설정

### 1. vercel.json 설정

프로젝트 루트에 `vercel.json` 파일을 생성하여 Git 기반 자동 배포를 비활성화합니다.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": false
  }
}
```

이 설정은 브랜치 push 시 Vercel 자동 배포를 막고, **태그 + GitHub Actions**로만 배포한다는 의미입니다.

### 2. Vercel 콘솔 설정

#### 2.1 프로젝트 구성

총 8개의 Vercel 프로젝트를 생성합니다:

| 프로젝트명            | 환경       | 브랜치    | 배포 타입  |
| --------------------- | ---------- | --------- | ---------- |
| web-user-staging      | staging    | `staging` | Production |
| web-user-production   | production | `main`    | Production |
| web-seller-staging    | staging    | `staging` | Production |
| web-seller-production | production | `main`    | Production |
| web-admin-staging     | staging    | `staging` | Production |
| web-admin-production  | production | `main`    | Production |
| web-info-staging      | staging    | `staging` | Production |
| web-info-production   | production | `main`    | Production |

#### 2.2 프로젝트 생성

1. 이전에 만들었던 프로젝트 설정 확인

#### 2.3 환경변수 설정

1. Vercel 대시보드 → 프로젝트 설정 → Environment Variables
2. 필요한 환경변수 추가 (값은 팀 내부에서 관리, 문서에 기록하지 않음)

**web-user (예시 키)**

- `NEXT_PUBLIC_NODE_ENV`, `NEXT_PUBLIC_API_DOMAIN`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_KAKAO_REST_API_KEY`, `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY`
- `NEXT_PUBLIC_SENTRY_DSN` (staging/production)
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

**web-info (예시 키)** — web-user와 같은 Next.js 구성이라 키 이름이 같습니다.

- `NEXT_PUBLIC_NODE_ENV` (`staging` / `production`), `NEXT_PUBLIC_SITE_URL` (staging은 `https://info-staging.picakes.com`)
- `NEXT_PUBLIC_SENTRY_DSN` (staging/production)
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (web-user와 같은 PostHog 프로젝트)

**web-seller / web-admin (예시 키)**

- `VITE_PUBLIC_NODE_ENV`, `VITE_PUBLIC_API_DOMAIN`
- `VITE_PUBLIC_GOOGLE_CLIENT_ID`, `VITE_PUBLIC_KAKAO_RESTAPI_KEY`
- `VITE_PUBLIC_SENTRY_DSN` (staging/production)
- `VITE_PUBLIC_POSTHOG_KEY`, `VITE_PUBLIC_POSTHOG_HOST`

**GitHub Actions Secrets (배포용)**

- Vercel 계정 설정에서 API 토큰 생성 후 GitHub `VERCEL_TOKEN` Secret 설정
- Vercel → 팀 선택 → Settings → General → Team ID 복사 및 GitHub `VERCEL_ORG_ID` Secret 설정
- Vercel → 각 프로젝트 → Settings → General → Project ID 복사 및 GitHub `VERCEL_PROJECT_ID_*` Secret 설정

| Secret                                    | 설명                              |
| ----------------------------------------- | --------------------------------- |
| `VERCEL_TOKEN`                            | Vercel API 토큰                   |
| `VERCEL_ORG_ID`                           | Vercel 팀/개인 Org ID             |
| `VERCEL_PROJECT_ID_WEB_USER_STAGING`      | web-user-staging 프로젝트 ID      |
| `VERCEL_PROJECT_ID_WEB_SELLER_STAGING`    | web-seller-staging 프로젝트 ID    |
| `VERCEL_PROJECT_ID_WEB_ADMIN_STAGING`     | web-admin-staging 프로젝트 ID     |
| `VERCEL_PROJECT_ID_WEB_USER_PRODUCTION`   | web-user-production 프로젝트 ID   |
| `VERCEL_PROJECT_ID_WEB_SELLER_PRODUCTION` | web-seller-production 프로젝트 ID |
| `VERCEL_PROJECT_ID_WEB_ADMIN_PRODUCTION`  | web-admin-production 프로젝트 ID  |
| `VERCEL_PROJECT_ID_WEB_INFO_STAGING`      | web-info-staging 프로젝트 ID      |
| `VERCEL_PROJECT_ID_WEB_INFO_PRODUCTION`   | web-info-production 프로젝트 ID   |
| `DISCORD_WEBHOOK_URL_WEB_FE`              | 배포 결과 Discord 알림 웹훅       |

> production 환경으로 배포하려면 해당 프로젝트의 `_PRODUCTION` Secret이 설정돼 있어야 합니다.
> 미설정 상태로 production 태그를 푸시하면 워크플로가 명확한 에러와 함께 중단됩니다.

### 3. GitHub 워크플로 (태그 기반 + Discord 알림)

`.github/workflows/deploy-web.yml`에서 태그 푸시 시 Vercel CLI로 빌드·배포하고, 성공/실패 시 Discord로 알립니다.

**워크플로 트리거:**

- `web-user/staging-*` · `web-user/production-*` 태그 푸시 시 web-user 배포
- `web-seller/staging-*` · `web-seller/production-*` 태그 푸시 시 web-seller 배포
- `web-admin/staging-*` · `web-admin/production-*` 태그 푸시 시 web-admin 배포
- `web-info/staging-*` · `web-info/production-*` 태그 푸시 시 web-info 배포

환경(`staging`/`production`)에 따라 대응하는 Vercel 프로젝트 ID Secret을 자동 선택합니다.

**워크플로 동작:**

1. 태그에서 프로젝트명·환경 추출 및 검증
2. 모노레포 의존성 설치 (`yarn install`)
3. `vercel pull` → `vercel build` → `vercel deploy` (배포 완료까지 대기)
4. Discord에 성공/실패, 배포 URL, GitHub Actions 로그 링크, Vercel 빌드 로그 일부 전송

자세한 워크플로 내용은 `.github/workflows/deploy-web.yml` 파일을 참고하세요.

> ⚠️ 태그를 여러 개 동시에 push하면(`git push origin tag1 tag2 ...`) 태그는 정상 생성되어도 GitHub Actions가 트리거되지 않는 현상이 있습니다. 태그마다 개별로 나눠 push하세요. 자세한 재현·대응 방법은 `.claude/skills/deploy/SKILL.md` 참고.

### 4. 도메인 구성 (선택사항)

커스텀 도메인 설정은 [EC2 배포 가이드(검증)](<../aws/(검증)EC2_Route53_S3_CloudFront.md>)의 Route53 섹션을 참고하세요.

## 참고 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Vercel 성능 최적화](https://vercel.com/docs/analytics)
