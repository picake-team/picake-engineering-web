---
description: staging을 main에 머지하고 production 태그를 자동 증가시켜 운영 배포합니다
argument-hint: "[프로젝트 — 예: web-user, backend. 생략 시 변경 파일로 자동 판단]"
---

`staging → main` PR을 만들어 머지하고, production 태그를 마지막 버전 +1로 붙여 운영에 배포합니다.

대상 지정: $ARGUMENTS

## ⚠️ 이 명령은 실제 사용자에게 나갑니다

되돌리기 어려운 작업이므로 **4단계에서 한 번 확인을 받습니다.** 그 외 단계는 묻지 않고 진행합니다.

remote는 `push-staging`의 "푸시 대상 remote 결정"과 동일하게 `$REMOTE`(`upstream`이 있으면 `upstream`, 없으면 `origin`)를 씁니다. Bash 호출마다 `REMOTE=$(git remote | grep -qx upstream && echo upstream || echo origin)`로 다시 정의합니다.

## 1. 사전 확인

```bash
git status --short
git fetch "$REMOTE" --tags --quiet
git log --oneline "$REMOTE"/main..HEAD
```

- 커밋 안 된 변경이 있으면 멈춥니다.
- `$REMOTE/main..HEAD`가 비어 있으면 배포할 게 없다는 뜻이니 알리고 멈춥니다.
- **스테이징에 먼저 올라갔는지 확인합니다.** 해당 커밋을 담은 staging 태그가 없으면 사용자에게 알리고 `/push-staging`을 먼저 할지 확인합니다.

## 2. PR 생성

제목·본문은 [[picake-git-pr-create]] skill의 형식을 따릅니다.

```bash
gh pr create --repo picake-team/picake-engineering-web --base main --head staging \
  --title "[APP][TYPE]: 설명" --body-file <임시파일>
```

본문에는 **왜 이 변경이 필요했는지**, **판단이 갈릴 수 있었던 지점**, **스테이징에서 확인한 결과**를 담습니다.

## 3. 필수 체크 통과 대기

`main` 브랜치 보호는 **`test-backend`** 체크를 요구합니다.

```bash
for i in $(seq 1 15); do
  st=$(gh pr view <번호> --repo picake-team/picake-engineering-web --json mergeStateStatus -q '.mergeStateStatus')
  echo "[$i] $st"
  case "$st" in CLEAN|UNSTABLE|HAS_HOOKS) break;; esac
  sleep 20
done
```

- `UNSTABLE` = 필수 체크는 통과, 비필수만 진행 중 → **머지 가능**
- `BLOCKED`이 계속되면 어떤 체크가 막고 있는지 확인해 보고합니다

```bash
gh pr view <번호> --repo picake-team/picake-engineering-web --json statusCheckRollup \
  --template '{{range .statusCheckRollup}}{{.name}}={{.conclusion}} ({{.status}}){{"\n"}}{{end}}'
```

웹만 바뀐 PR은 `test-backend`가 백엔드 변경 없음을 감지해 **5초 만에 skip+success** 합니다. 여기서 오래 걸리면 워크플로우 쪽 문제입니다.

`--admin`으로 브랜치 보호를 우회하지 **않습니다.** 막히면 원인을 보고하고 사용자 판단을 받습니다.

## 4. 배포 직전 확인 (유일한 확인 지점)

머지하기 전에 아래를 보여주고 승인받습니다.

- PR 번호·제목, 포함된 커밋 목록
- 배포될 프로젝트와 환경
- 마지막 production 태그 → 새로 붙일 태그
- 스테이징에서 확인된 사항

## 5. 머지 → 태그

**production 태그는 반드시 main의 머지 커밋에 붙입니다** (staging 브랜치 커밋이 아님). 기존 릴리스가 전부 이 방식입니다.

```bash
gh pr merge <번호> --repo picake-team/picake-engineering-web --merge
git fetch "$REMOTE" --quiet

MERGE=$(gh pr view <번호> --repo picake-team/picake-engineering-web --json mergeCommit -q '.mergeCommit.oid')

PREFIX="<프로젝트>/production"
LAST=$(git tag --list "$PREFIX-v*" --sort=-v:refname | head -1)
VER=${LAST##*-v}
NEXT="$PREFIX-v${VER%.*}.$(( ${VER##*.} + 1 ))"

git tag -a "$NEXT" "$MERGE" -m "<프로젝트> production <버전> — <핵심 변경 한 줄>"
git push "$REMOTE" "$NEXT"
```

태그가 여러 개여도 **하나씩** 푸시합니다.

## 6. 트리거 확인 → 완료까지 관찰

```bash
sleep 15
gh run list --repo picake-team/picake-engineering-web --workflow deploy-web.yml --limit 1 \
  --json databaseId,headBranch -q '.[0]'
gh run watch <run-id> --repo picake-team/picake-engineering-web --exit-status
```

run이 안 생겼으면 태그 삭제 후 재푸시합니다 (`push-staging` 5단계와 동일).

## 7. 운영 실동작 검증 (필수)

배포 성공 로그만 믿지 말고 **실제 응답을 확인합니다.**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://picakes.com/
```

변경된 화면이 있으면 해당 경로를 직접 요청해 반영 여부를 확인합니다. 리다이렉트나 UA 분기가 있으면 UA별로 확인합니다.

## 8. 보고

- PR 번호·머지 커밋, 태그명, run 결과
- 운영에서 실제로 확인한 내용
- 사용자가 직접 확인하면 좋을 항목
