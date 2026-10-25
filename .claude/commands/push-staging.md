---
description: 현재 브랜치를 푸시하고 staging 태그를 자동 증가시켜 스테이징 배포합니다
argument-hint: "[프로젝트 — 예: web-user, backend. 생략 시 변경 파일로 자동 판단]"
---

현재 브랜치를 푸시하고, staging 태그를 마지막 버전 +1로 만들어 배포까지 확인합니다. 이 명령을 실행한 것 자체가 배포 승인이므로 중간에 다시 묻지 않습니다.

대상 지정: $ARGUMENTS

## ⚠️ remote는 반드시 `upstream`

`origin`에는 push URL이 **두 개**(개인 포크 + picake-team) 걸려 있어서 포크에도 함께 쏩니다. 태그·브랜치 푸시는 전부 `upstream`을 씁니다.

```bash
git remote -v   # upstream = picake-team/picake-engineering 인지 확인
```

## 1. 사전 확인

```bash
git status --short
git log --oneline -5
git fetch upstream --tags --quiet
```

- 커밋 안 된 변경이 있으면 **멈추고** 사용자에게 알립니다 (`/commit` 안내). 배포는 커밋된 것만 나갑니다.
- 로컬 브랜치가 `upstream`보다 뒤처져 있으면 알리고 멈춥니다.

## 2. 배포 대상 프로젝트 판단

인자로 지정됐으면 그것을 씁니다. 없으면 **마지막 staging 태그 이후의 변경 경로**로 판단합니다.

```bash
LAST=$(git tag --list "web-user/staging-v*" --sort=-v:refname | head -1)
git diff --name-only "$LAST"..HEAD | awk -F/ '/^apps\//{print $2}' | sort -u
```

`apps/` 밖(루트 설정 등)만 바뀌면 결과가 비어 나옵니다.

| 변경 경로            | 프로젝트     |
| -------------------- | ------------ |
| `apps/web-user/**`   | `web-user`   |
| `apps/web-seller/**` | `web-seller` |
| `apps/web-admin/**`  | `web-admin`  |
| `apps/backend/**`    | `backend`    |

루트 설정만 바뀐 경우엔 어느 앱을 배포할지 사용자에게 확인합니다.

## 3. 다음 버전 계산 (마지막 태그 +1)

```bash
PREFIX="<프로젝트>/staging"
LAST=$(git tag --list "$PREFIX-v*" --sort=-v:refname | head -1)
VER=${LAST##*-v}
NEXT="$PREFIX-v${VER%.*}.$(( ${VER##*.} + 1 ))"
echo "$LAST → $NEXT"
```

패치 자리만 올립니다. major/minor를 올려야 할 변경이면 임의로 판단하지 말고 사용자에게 확인합니다.

## 4. 브랜치 푸시 → 태그 푸시

```bash
git push upstream <현재브랜치>
git tag -a "$NEXT" -m "<프로젝트> staging <버전> — <핵심 변경 한 줄>"
git push upstream "$NEXT"
```

**⚠️ 태그가 여러 개면 한 명령에 묶지 말고 하나씩 푸시합니다.** 묶어서 푸시하면 태그는 생성되는데 GitHub Actions가 트리거되지 않는 현상이 있습니다.

## 5. 트리거 확인 (필수)

```bash
sleep 15
gh run list --repo picake-team/picake-engineering --workflow deploy-web.yml --limit 3 \
  --json databaseId,headBranch,status,conclusion \
  --template '{{range .}}{{.databaseId}} {{.headBranch}} {{.status}} {{.conclusion}}{{"\n"}}{{end}}'
```

backend면 `deploy-staging-backend-ec2.yml`을 봅니다.

**run이 안 생겼으면** 태그를 지우고 다시 푸시합니다.

```bash
git push upstream :refs/tags/"$NEXT"
git push upstream "$NEXT"
```

## 6. 완료까지 관찰

```bash
gh run watch <run-id> --repo picake-team/picake-engineering --exit-status
```

실패하면 로그를 확인해 원인을 보고합니다.

## 7. 실동작 검증

배포 성공 후 실제 응답을 확인합니다. 화면 변경이면 눈으로도 봅니다.

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://staging.picakes.com/
```

## 8. 보고

- 태그명, run 결과, 스테이징 URL
- 확인해볼 화면 경로
- 운영 배포는 `/push-production`이라고 안내
