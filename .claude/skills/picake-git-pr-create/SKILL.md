---
name: picake-git-pr-create
description: Picake 저장소에서 Pull Request를 생성할 때 사용합니다. "PR 만들어줘", "PR 올려줘", "PR 열어줘" 같은 요청을 받으면 이 skill을 따르세요.
---

# PR 생성

`gh` CLI로 GitHub Pull Request를 생성합니다. **draft PR은 묻지 않고 만들고 링크를 알립니다**(운영자와 정한 방식). draft가 아닌 PR(리뷰 요청)과 `main` 대상 PR만 만들기 전에 확인받습니다.

## 1. 브랜치·담당자

말이 없으면 아래 기본값을 쓰고 묻지 않습니다. 다르게 하라고 하면 그대로 따릅니다.

| 항목   | 기본값                                                                               |
| ------ | ------------------------------------------------------------------------------------ |
| head   | 지금 작업 브랜치(`staging`·`main`이면 멈추고 작업 브랜치부터 만든다)                 |
| base   | `staging` (`staging → main`은 배포 skill [[picake-deploy-release]] 6번에서만 만든다) |
| 담당자 | 운영자 `geunu97`                                                                     |
| 상태   | draft                                                                                |

애매한 것(예: base에 이미 올라간 변경까지 포함해야 하는지)만 묻습니다.

## 2. 브랜치 상태 확인

```bash
git status
git fetch origin
git log <base>...<head> --oneline
git diff <base>...<head> --stat
```

- head 브랜치에 로컬에만 있는 커밋이 있으면 작업 브랜치를 push합니다(`git push -u origin <head>`). `staging`·`main`에는 직접 push하지 않습니다.
- head/base 브랜치가 로컬에 없으면 origin 기준으로 존재하는지 확인합니다.

## 3. PR 제목 자동 작성

`git log <base>...<head>`와 변경 파일을 분석해서 아래 규칙으로 제목을 직접 작성합니다 (사용자에게 묻지 않음).

```
[APP1,APP2][TYPE]: 설명
```

- **APP**: [[picake-git-commit-convention]] skill과 동일한 기준으로 판단 (`git diff <base>...<head> --stat`로 변경 경로 확인)
  - `WEB-USER` (`apps/web-user`), `WEB-SELLER` (`apps/web-seller`), `WEB-ADMIN` (`apps/web-admin`), `WEB-INFO` (`apps/web-info`), `COMMON` (특정 앱에 한정되지 않는 변경)
  - 여러 앱에 걸친 변경이면 콤마로 나열 (예: `[WEB-USER,WEB-SELLER]`)
- **TYPE**: 변경 내용의 성격에 맞게 하나 선택
  - `ADD` (새 기능), `UPDATE` (기존 기능 개선/변경), `FIX` (버그 수정), `REFACTOR` (리팩토링), `REMOVE` (삭제), `DOCS` (문서), `CHORE` (빌드/설정/의존성)
- **설명**: 한국어로, 이 PR이 무엇을 하는지 간결하게 (커밋이 여러 개면 전체를 아우르는 요약)
- 커밋이 하나뿐이고 이미 이 형식을 따른다면 그 커밋 메시지를 그대로 제목으로 써도 됩니다.

## 4. PR 본문 자동 작성 (고정 레이아웃)

본문 내용은 매번 커밋/diff를 분석해서 직접 채우되, **아래 레이아웃 구조는 이 skill을 쓸 때마다 항상 동일하게 유지**합니다.

```markdown
## 📋 요약

<이 PR이 무엇을 하는지 1~3문장>

## ✨ 주요 변경사항

- [APP] 변경 내용 1
- [APP] 변경 내용 2

## 🧪 테스트 계획

- [ ] 확인이 필요한 항목 1
- [ ] 확인이 필요한 항목 2

## 📎 참고 사항

<리뷰어가 알아야 할 특이사항, 주의사항, 마이그레이션 등. 없으면 이 섹션 자체를 생략>
```

- "주요 변경사항"은 커밋 단위 또는 의미 단위로 묶어서 정리 (커밋 메시지 나열이 아니라 요약).
- "테스트 계획"은 변경 내용에 맞춰 실제로 확인해야 할 항목을 판단해서 작성 (예: 특정 화면 동작 확인, staging 배포 후 확인 등).
- "참고 사항" 섹션은 정말 알릴 내용이 있을 때만 포함합니다.

## 5. 만들기

draft는 바로 만듭니다. draft가 아니거나 base가 `main`이면 base ← head·담당자·제목·본문을 보여 주고 확인받은 뒤 만듭니다.

```bash
gh pr create --draft --base <base> --head <head> --title "<제목>" --assignee "<담당자>" --body-file <임시파일>
```

- 본문은 개행이 많으므로 `--body-file`로 넘깁니다(따옴표/이스케이프 문제 방지).
- 같은 head로 열린 PR이 이미 있으면 새로 만들지 않고 제목·본문을 고칩니다(`gh pr edit`).
- 만든 뒤 PR URL을 알려 줍니다.
