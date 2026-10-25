---
description: 변경사항을 분석해 논리 단위로 나눠 커밋합니다 (Picake 접두사 규칙 적용)
argument-hint: "[추가 지시 — 예: 한 커밋으로, 특정 파일만]"
---

작업 트리의 변경사항을 분석해서 커밋합니다. 이 명령을 실행한 것 자체가 커밋 승인이므로 별도로 다시 묻지 않습니다.

추가 지시: $ARGUMENTS

## 1. 변경사항 파악

```bash
git status --short
git diff --stat
git diff            # 수정된 파일
git diff --staged   # 이미 스테이징된 것이 있으면
```

새 파일(`??`)의 내용도 반드시 읽습니다. diff에 안 나옵니다.

## 2. 타입체크 (경고만, 차단하지 않음)

```bash
yarn workspace @picake/web-user exec tsc --noEmit   # web-user 변경 시
yarn workspace @picake/backend exec tsc --noEmit    # backend 변경 시
```

실패하면 **커밋하지 말고** 사용자에게 알립니다.

린트(`yarn common:lint`)는 `--max-warnings=0`이라 기존 경고만으로도 실패합니다. 돌린다면 **기존 경고 수와 비교**해서 늘었을 때만 문제 삼습니다.

## 3. 논리 단위로 분리

성격이 다른 변경은 **커밋을 나눕니다.** 파일이 겹치지 않으면 나누는 쪽이 기본입니다.

- 기능 추가와 버그 수정 → 분리
- 서로 다른 화면/도메인 → 분리
- 리팩터링과 동작 변경 → 분리
- 한 기능을 위해 함께 움직여야 하는 파일들 → 같은 커밋

사용자가 "한 커밋으로"라고 하면 합칩니다.

## 4. 접두사 결정

[[picake-git-commit-convention]] skill 기준입니다.

| 접두사         | 대상                                                   |
| -------------- | ------------------------------------------------------ |
| `[WEB-USER]`   | `apps/web-user`                                        |
| `[WEB-SELLER]` | `apps/web-seller`                                      |
| `[WEB-ADMIN]`  | `apps/web-admin`                                       |
| `[BE]`         | `apps/backend`                                         |
| `[COMMON]`     | 특정 앱에 한정되지 않는 변경 (루트 설정, 여러 앱 동시) |

## 5. 메시지 작성

```
[접두사]: 무엇을 했는지 (한국어, 50자 내외)

왜 이 변경이 필요했는지 — 문제 상황부터.

- 핵심 변경점
- 판단이 갈릴 수 있었던 지점과 그 이유
- 측정값이 있으면 숫자로 (예: /products 4건 → 2건)
```

**본문은 "무엇을 바꿨는지"가 아니라 "왜 그렇게 했는지"를 씁니다.** 무엇을 바꿨는지는 diff에 이미 있습니다. 나중에 이 코드를 의심할 사람이 알아야 할 맥락을 남깁니다.

커밋 메시지 끝에 반드시 붙입니다. 모델명은 **현재 세션의 실제 모델**로 씁니다 (세션마다 다르므로 고정값을 쓰지 않습니다).

```
Co-Authored-By: <현재 세션의 모델명> <noreply@anthropic.com>
```

## 6. 커밋

경로에 `[productId]` 같은 대괄호가 있으면 따옴표로 감쌉니다.

```bash
git add "<파일들>"
git commit -F - <<'MSG'
...
MSG
```

`.git/index.lock` 오류가 나면 **바로 지우지 말고** 먼저 확인합니다.

```bash
pgrep -lf "bin/git " || echo "실행 중인 git 없음"
ls -la .git/index.lock
```

git 프로세스가 없고 lock이 오래된 0바이트 파일이면 stale이므로 제거하고 진행합니다. 실행 중인 git이 있으면 사용자에게 알리고 멈춥니다.

## 7. 보고

커밋 해시와 제목을 나열하고, **푸시는 하지 않았다**고 명시합니다. 푸시가 필요하면 `/push-staging`을 안내합니다.
