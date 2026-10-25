---
name: picake-deploy-release
description: Picake의 태그 기반 배포(backend는 AWS EC2, web-user/web-seller/web-admin은 Vercel)를 진행할 때 사용합니다. "배포해줘", "스테이징에 올려줘", "프로덕션 배포", "태그 만들어서 배포", "release" 같은 요청이면 이 skill을 반드시 사용하세요. 배포 실패 원인 파악이나 배포 상태 확인 요청에도 사용합니다.
---

# 배포 (태그 기반 CI/CD)

Picake는 Git 태그 push를 트리거로 GitHub Actions가 자동 배포합니다. 사람이 직접 서버에 접속해서 배포하지 않습니다.

## 1. 대상/환경/브랜치 확인

사용자에게 아래 3가지가 명확하지 않으면 먼저 확인합니다.

- **프로젝트**: `backend` | `web-user` | `web-seller` | `web-admin`
- **환경**: `staging` | `production`
- **브랜치**: 태그를 만들 기준 브랜치 (`main`, `staging`, 기타). staging/production 환경별로 고정된 브랜치 규칙이 없으므로, 배포할 때마다 반드시 사용자에게 확인합니다.

## 2. 버전 결정 (마지막 태그 +1)

버전은 임의로 정하지 않고, **반드시 같은 프로젝트+환경 조합의 마지막 배포 태그를 찾아 그 버전의 숫자를 +1** 합니다.

```bash
git fetch --tags
git tag --list "{프로젝트}/{환경}-*" --sort=-v:refname | head -5
```

- 예: 마지막 태그가 `web-user/production-v1.2.3`이면 다음 태그는 `web-user/production-v1.2.4` (마지막 숫자를 +1).
- 해당 프로젝트+환경 조합의 태그가 하나도 없다면 시작 버전(예: `v1.0.0`)을 사용자에게 확인합니다.
- major/minor를 올려야 하는 배포(호환성이 깨지는 변경 등)라면 임의로 판단하지 말고 사용자에게 먼저 확인합니다.

## 3. 태그 형식

```
{프로젝트}/{환경}-{버전}
```

버전은 `vX.Y.Z` 형식을 사용합니다 (2번에서 결정한 값).

```bash
git tag backend/production-v1.0.0
git tag web-user/staging-v0.3.1
```

## 4. 배포 실행 (사용자 확인 필수)

태그를 만들거나 push하기 **직전에 반드시** 아래 내용을 사용자에게 보여주고 명시적으로 확인받습니다. 확인 없이는 절대 진행하지 않습니다.

- 배포 대상 프로젝트 / 환경
- 1번에서 확인한 브랜치와 그 브랜치의 최신 커밋 (`git status`, `git log -1`로 확인)
- 2번에서 결정한 마지막 태그 → 새로 생성할 태그명

사용자 확인 후에만 아래를 실행합니다.

```bash
git tag <새 태그명>
git push origin <새 태그명>
```

- 사용자가 명시적으로 요청하지 않으면 애초에 태그를 만들거나 push하지 않습니다 (CLAUDE.md의 "명시적 요청 없이 커밋 금지" 원칙과 동일하게 취급).
- **⚠️ 태그를 여러 개 동시에 배포할 때는 `git push origin tag1 tag2 tag3 ...`처럼 한 명령에 묶지 말고, 태그마다 개별 `git push origin <태그명>`으로 나눠서 실행하세요.** 실제로 여러 태그를 한 번에 push하면 태그 자체는 정상 생성되는데도(`git ls-remote`로 확인 가능) GitHub Actions가 전혀 트리거되지 않는 현상을 확인했습니다(4개 동시 push → 4개 다 무반응, 개별로 나눠 재시도하니 정상 트리거). push 직후 반드시 `gh run list --repo picake-team/picake-engineering --workflow=<워크플로 파일> --limit 3`으로 실제 run이 생성됐는지 확인하고, 안 생겼으면 `git push origin :refs/tags/<태그명>`으로 삭제 후 그 태그만 다시 push하면 트리거됩니다.

## 5. 트리거되는 워크플로우

| 프로젝트                                | 워크플로우 파일                                       | 플랫폼  |
| --------------------------------------- | ----------------------------------------------------- | ------- |
| `backend` (staging)                     | `.github/workflows/deploy-staging-backend-ec2.yml`    | AWS EC2 |
| `backend` (production)                  | `.github/workflows/deploy-production-backend-ec2.yml` | AWS EC2 |
| `web-user` / `web-seller` / `web-admin` | `.github/workflows/deploy-web.yml`                    | Vercel  |
