---
name: picake-git-commit-convention
description: Picake 저장소에 커밋 메시지를 작성할 때 사용합니다. "커밋해줘", "커밋 메시지 만들어줘" 같은 요청을 받으면 이 skill의 접두사 규칙을 따르세요.
---

# 커밋 메시지 규칙

이 레포(`picake-engineering-web`)는 웹 전용입니다. backend 레포는 `[BE]`/`[COMMON]`을 씁니다.

## 형식

```
[접두사]: 내용
```

- 접두사는 아래 4개 중 변경 범위에 맞는 것 하나를 사용합니다.
  - `[WEB-USER]`
  - `[WEB-SELLER]`
  - `[WEB-ADMIN]`
  - `[COMMON]`
- 내용(본문)은 한국어로 작성합니다.

## 접두사 선택 기준

| 접두사         | 대상                                                                |
| -------------- | ------------------------------------------------------------------- |
| `[WEB-USER]`   | `apps/web-user` 변경                                                |
| `[WEB-SELLER]` | `apps/web-seller` 변경                                              |
| `[WEB-ADMIN]`  | `apps/web-admin` 변경                                               |
| `[COMMON]`     | 특정 앱에 한정되지 않는 공통 변경 (루트 설정, 여러 앱 동시 변경 등) |

`git status`로 변경된 파일이 어느 앱/영역에 속하는지 먼저 확인한 뒤 접두사를 정합니다.

## 예시

```
[WEB-USER]: 로그인 페이지 접근성 개선
[WEB-SELLER]: 상품 등록 폼 검증 오류 수정
[COMMON]: ESLint 설정 업데이트
```

## 주의

- 사용자가 명시적으로 요청하지 않으면 커밋하지 않습니다.
