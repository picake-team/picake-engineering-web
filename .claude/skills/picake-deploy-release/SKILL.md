---
name: picake-deploy-release
description: Picake web-user/web-seller/web-admin/web-info(Vercel)의 태그 기반 배포를 진행할 때 사용합니다. backend 배포는 `picake-engineering-backend` 레포의 같은 skill을 씁니다. "배포해줘", "스테이징에 올려줘", "프로덕션 배포", "태그 만들어서 배포", "release" 같은 요청이나 `/push-staging`·`/push-production` 명령이면 이 skill을 따르세요. 배포 실패 원인 파악이나 배포 상태 확인 요청에도 사용합니다.
---

# 배포 (태그 기반 CI/CD)

Git 태그 push를 트리거로 GitHub Actions가 자동 배포합니다. 사람이 직접 서버에 접속해서 배포하지 않습니다. backend 배포는 `picake-engineering-backend` 레포의 같은 skill을 씁니다.

## 0. 승인 규칙

- 사용자가 명시적으로 배포를 요청하지 않으면 태그를 만들거나 push하지 않습니다.
- **staging**: `/push-staging` 실행이나 "스테이징에 올려줘" 같은 명시적 요청 자체가 승인입니다. 중간에 다시 묻지 않습니다.
- **production**: 실제 사용자에게 나가므로 **머지 직전(6-4) 한 번** 확인을 받습니다. 그 외 단계는 묻지 않습니다.
- 대상·버전이 애매하면(아래 3·4번) 진행 전에 확인합니다.

## 1. 푸시 대상 remote 결정 (`$REMOTE`)

태그·브랜치 push와 fetch는 **picake-team 원본 레포**를 가리키는 remote로 합니다. 개인 포크를 쓰는 환경에서는 `origin`에 push URL이 두 개(개인 포크 + picake-team) 걸려 포크에도 함께 쏘므로 원본은 `upstream`으로 따로 둡니다. 포크 없이 직접 clone한 환경에는 `upstream`이 없고 `origin`이 곧 원본입니다.

```bash
# upstream이 있으면 upstream, 없으면 origin (Bash 호출마다 다시 정의해야 합니다)
REMOTE=$(git remote | grep -qx upstream && echo upstream || echo origin)
git remote get-url "$REMOTE"   # picake-team/picake-engineering-web 인지 확인
```

URL이 `picake-team/picake-engineering-web`이 아니면 **멈추고** 사용자에게 알립니다.

## 2. 사전 확인

```bash
git status --short
git log --oneline -5
git fetch "$REMOTE" --tags --quiet
```

- 커밋 안 된 변경이 있으면 **멈추고** 알립니다(`/commit` 안내). 배포는 커밋된 것만 나갑니다.
- 로컬 브랜치가 `$REMOTE`보다 뒤처져 있으면 알리고 멈춥니다.

## 3. 배포 대상

인자나 요청으로 지정됐으면 그것을 씁니다. 없으면 **마지막 staging 태그 이후의 변경 경로**로 판단합니다.

```bash
LAST=$(git tag --list "web-user/staging-v*" --sort=-v:refname | head -1)
git diff --name-only "$LAST"..HEAD | awk -F/ '/^apps\//{print $2}' | sort -u
```

| 변경 경로            | 프로젝트     |
| -------------------- | ------------ |
| `apps/web-user/**`   | `web-user`   |
| `apps/web-seller/**` | `web-seller` |
| `apps/web-admin/**`  | `web-admin`  |
| `apps/web-info/**`   | `web-info`   |

`apps/` 밖(루트 설정 등)만 바뀌면 결과가 비어 나옵니다. 이때는 어느 앱을 배포할지 사용자에게 확인합니다.

## 4. 버전 계산 (마지막 태그 +1)

버전은 임의로 정하지 않고, **같은 프로젝트+환경의 마지막 태그에서 패치 자리만 +1** 합니다.

```bash
PREFIX="<프로젝트>/<환경>"          # 환경: staging | production
LAST=$(git tag --list "$PREFIX-v*" --sort=-v:refname | head -1)
VER=${LAST##*-v}
NEXT="$PREFIX-v${VER%.*}.$(( ${VER##*.} + 1 ))"
echo "$LAST → $NEXT"
```

- 태그 형식은 `<프로젝트>/<환경>-vX.Y.Z`입니다.
- 해당 조합의 태그가 하나도 없거나 major/minor를 올려야 하는 변경이면 임의로 판단하지 말고 확인합니다.

## 5. staging 배포

현재 브랜치를 push하고 태그를 붙입니다. 현재 브랜치가 `staging`이 아니면 어떤 브랜치를 배포하는지 보고에 명시합니다.

```bash
git push "$REMOTE" <현재브랜치>
git tag -a "$NEXT" -m "<프로젝트> staging <버전> — <핵심 변경 한 줄>"
git push "$REMOTE" "$NEXT"
```

이어서 7~10번을 진행합니다(워크플로우: `deploy-web.yml`).

## 6. production 배포

### 6-1. 사전 확인

```bash
git log --oneline "$REMOTE"/main.."$REMOTE"/staging
```

- 비어 있으면 배포할 게 없다는 뜻이니 알리고 멈춥니다.
- **스테이징에 먼저 올라갔는지 확인합니다.** 해당 커밋을 담은 staging 태그가 없으면 알리고 staging 배포를 먼저 할지 확인합니다.

### 6-2. `staging → main` PR 생성

제목·본문은 [[picake-git-pr-create]] skill 형식을 따릅니다. 본문에는 왜 이 변경이 필요했는지, 판단이 갈릴 수 있었던 지점, 스테이징에서 확인한 결과를 담습니다.

```bash
gh pr create --repo picake-team/picake-engineering-web --base main --head staging \
  --title "[APP][TYPE]: 설명" --body-file <임시파일>
```

### 6-3. 필수 체크 통과 대기

`main` 브랜치 보호는 `test-web (web-user)` · `test-web (web-seller)` · `test-web (web-admin)` · `test-web (web-info)` 체크를 요구합니다.

```bash
for i in $(seq 1 15); do
  st=$(gh pr view <번호> --repo picake-team/picake-engineering-web --json mergeStateStatus -q '.mergeStateStatus')
  echo "[$i] $st"
  case "$st" in CLEAN|UNSTABLE|HAS_HOOKS) break;; esac
  sleep 20
done
```

- `UNSTABLE` = 필수 체크는 통과, 비필수만 진행 중 → **머지 가능**
- `BLOCKED`이 계속되면 어떤 체크가 막고 있는지 확인해 보고합니다.

```bash
gh pr view <번호> --repo picake-team/picake-engineering-web --json statusCheckRollup \
  --template '{{range .statusCheckRollup}}{{.name}}={{.conclusion}} ({{.status}}){{"\n"}}{{end}}'
```

`test-web`은 해당 앱 변경이 없거나 `test` 스크립트가 없으면 **수 초 만에 skip+success** 합니다. 여기서 오래 걸리면 워크플로우 쪽 문제입니다. `--admin`으로 브랜치 보호를 우회하지 **않습니다.**

### 6-4. 머지 직전 확인 (production의 유일한 확인 지점)

PR 번호·제목과 포함된 커밋, 배포 대상과 환경, 마지막 production 태그 → 새 태그, 스테이징에서 확인된 사항을 보여주고 승인받습니다.

### 6-5. 머지 → 태그

**production 태그는 반드시 main의 머지 커밋에 붙입니다**(staging 브랜치 커밋이 아님). 기존 릴리스가 전부 이 방식입니다.

```bash
gh pr merge <번호> --repo picake-team/picake-engineering-web --merge
git fetch "$REMOTE" --quiet
MERGE=$(gh pr view <번호> --repo picake-team/picake-engineering-web --json mergeCommit -q '.mergeCommit.oid')
git tag -a "$NEXT" "$MERGE" -m "<프로젝트> production <버전> — <핵심 변경 한 줄>"
git push "$REMOTE" "$NEXT"
```

이어서 7~10번을 진행합니다(워크플로우: `deploy-web.yml`).

## 7. 트리거 확인 (필수)

**⚠️ 태그가 여러 개면 한 명령에 묶지 말고 하나씩 push합니다.** 여러 태그를 한 번에 push하면 태그 자체는 정상 생성되는데도(`git ls-remote`로 확인 가능) GitHub Actions가 전혀 트리거되지 않는 현상을 확인했습니다(4개 동시 push → 4개 다 무반응, 개별로 나눠 재시도하니 정상 트리거).

```bash
sleep 15
gh run list --repo picake-team/picake-engineering-web --workflow <워크플로우 파일> --limit 3 \
  --json databaseId,headBranch,status,conclusion \
  --template '{{range .}}{{.databaseId}} {{.headBranch}} {{.status}} {{.conclusion}}{{"\n"}}{{end}}'
```

run이 안 생겼으면 그 태그만 지우고 다시 push합니다.

```bash
git push "$REMOTE" :refs/tags/"$NEXT"
git push "$REMOTE" "$NEXT"
```

## 8. 완료까지 관찰

```bash
gh run watch <run-id> --repo picake-team/picake-engineering-web --exit-status
```

실패하면 로그를 확인해 원인을 보고합니다.

## 9. 실동작 검증 (필수)

배포 성공 로그만 믿지 말고 실제 응답을 확인합니다.

**staging**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://staging.picakes.com/          # web-user
curl -s -o /dev/null -w "%{http_code}\n" https://seller-staging.picakes.com/   # web-seller
curl -s -o /dev/null -w "%{http_code}\n" https://admin-staging.picakes.com/    # web-admin
curl -s -o /dev/null -w "%{http_code}\n" https://info-staging.picakes.com/seller/about   # web-info
```

화면 변경이면 해당 경로를 직접 열어 눈으로도 확인합니다.

**production**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://picakes.com/          # web-user
curl -s -o /dev/null -w "%{http_code}\n" https://seller.picakes.com/   # web-seller
curl -s -o /dev/null -w "%{http_code}\n" https://admin.picakes.com/    # web-admin
curl -s -o /dev/null -w "%{http_code}\n" https://info.picakes.com/seller/about   # web-info
```

변경된 화면이 있으면 해당 경로를 직접 요청해 반영 여부를 확인합니다. 리다이렉트나 UA 분기가 있으면 UA별로 확인합니다.

## 10. 보고

- 태그명, run 결과, (production이면) PR 번호·머지 커밋
- 실동작 검증 결과, 확인해볼 화면 경로
- staging이었다면 운영 배포는 `/push-production`이라고 안내

## 워크플로우

| 환경       | 워크플로우 파일                    | 플랫폼 |
| ---------- | ---------------------------------- | ------ |
| staging    | `.github/workflows/deploy-web.yml` | Vercel |
| production | `.github/workflows/deploy-web.yml` | Vercel |
