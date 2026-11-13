# AI 코딩 에이전트 - 가이드

이 문서는 Picake 저장소에서 AI 코딩 에이전트(Claude Code 등)가 작업할 때 사용하는 설정을 설명합니다.

## 📄 CLAUDE.md

저장소 루트의 `CLAUDE.md`는 AI 코딩 에이전트가 작업 전 참고하는 가이드 문서입니다. 기존 `AGENTS.md`를 대체합니다.

## 📁 .claude/skills

반복적으로 수행하는 작업을 저장소 전용 규칙으로 정의해 둔 skill 모음입니다. 각 skill은 `.claude/skills/<이름>/SKILL.md`에 있고, 그 skill이 고치는 코드가 있는 레포에 둡니다(소셜 로그인·앱 딥링크·약관·스토어 심사처럼 web·backend를 같이 고치는 일은 이 레포). 커밋·PR·배포·문서 skill은 레포마다 접두사·배포 방법이 달라 레포별로 따로 둡니다.

| Skill                          | 용도                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `picake-git-commit-convention` | 커밋 메시지 접두사 규칙(`[WEB-USER]`/`[WEB-SELLER]`/`[WEB-ADMIN]`/`[WEB-INFO]`/`[COMMON]`)    |
| `picake-git-pr-create`         | Pull Request 생성(기본: draft, base `staging`)                                                |
| `picake-deploy-release`        | 태그 기반 배포 진행 (web-user/web-seller/web-admin/web-info는 Vercel, backend는 backend 레포) |
| `picake-docs-refresh`          | 특정 변경과 무관하게 문서 전체를 현재 코드베이스 기준으로 재점검                              |
| `picake-auth-social-login`     | 구글/카카오/애플 등 소셜 로그인(OAuth) 기능 추가·수정 시 기존 패턴 재사용                     |
| `picake-link-app-deep-links`   | web-user 도메인 링크를 iOS/Android 네이티브 앱으로 여는 딥링크 설정 추가·수정                 |
| `picake-legal-terms`           | 통신판매업 신고정보·이용약관·개인정보처리방침 등 법적 고지사항 작성·갱신                      |
| `picake-app-review`            | 손님·사장님 앱 화면 검토·다듬기(로컬에서 눌러 보고 전·후 그림으로 골라 받기)                  |
| `picake-review-ios-app-store`  | 손님·사장님 앱 스토어 심사 준비·반려 대응(App Store 중심, Google Play 앱 액세스 포함)         |
| `design-taste-frontend`        | (외부 skill, `skills-lock.json`) 랜딩·리디자인 등 새로 디자인할 때만 참고                     |
| `emil-design-eng`              | (외부 skill, `skills-lock.json`) UI 디테일·애니메이션 원칙. 앱 화면은 디자인 기준 문서가 먼저 |

> 카카오 알림톡 템플릿(`picake-notify-kakao-template`)처럼 backend 전용 skill은 [picake-engineering-backend](https://github.com/picake-team/picake-engineering-backend) 레포에, 앱 확인·출시(`picake-app-test`·`picake-app-release`)는 앱 레포 picake-engineering-app(비공개)에, 인프라 모니터링(`picake-infra-monitor`)·데이터 리포트(`picake-data-report`)·웹 성능(`picake-web-performance`) 같은 운영 skill은 회사 운영 레포 picake-hq(비공개)의 `.claude/skills`에 있습니다. 어느 요청에 어느 skill을 쓰는지는 루트 `CLAUDE.md` "다른 레포의 skill" 표에 있습니다.

## 📄 .claude/settings.json

Claude Code의 저장소 공통 권한 설정입니다. 개인별 설정은 `.claude/settings.local.json`(gitignore 대상)에 둡니다.

## 📄 .mcp.json

Claude Code가 연결하는 MCP(Model Context Protocol) 서버 목록입니다. PostHog, Vercel, Sentry, AWS, Firebase, 카카오, GCP, Solapi, Google Sheets/Docs 등 팀에서 사용하는 외부 서비스에 에이전트가 직접 조회·조작할 수 있도록 연동되어 있습니다.
