# AI 코딩 에이전트 - 가이드

이 문서는 Picake 저장소에서 AI 코딩 에이전트(Claude Code 등)가 작업할 때 사용하는 설정을 설명합니다.

## 📄 CLAUDE.md

저장소 루트의 `CLAUDE.md`는 AI 코딩 에이전트가 작업 전 참고하는 가이드 문서입니다. 기존 `AGENTS.md`를 대체합니다.

## 📁 .claude/skills

반복적으로 수행하는 작업을 저장소 전용 규칙으로 정의해 둔 슬래시 커맨드(skill) 모음입니다. 각 skill은 `.claude/skills/<이름>/SKILL.md`에 정의되어 있습니다.

| Skill                          | 용도                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `picake-git-commit-convention` | 저장소 커밋 메시지 접두사 규칙(`[WEB-USER]`/`[WEB-SELLER]`/`[WEB-ADMIN]`/`[COMMON]`)에 맞춰 작성 |
| `picake-git-pr-create`         | Pull Request 생성                                                                                |
| `picake-deploy-release`        | 태그 기반 배포 진행 (web-user/web-seller/web-admin은 Vercel, backend는 backend 레포)             |
| `picake-docs-refresh`          | 특정 변경과 무관하게 문서 전체를 현재 코드베이스 기준으로 재점검                                 |
| `picake-auth-social-login`     | 구글/카카오/애플 등 소셜 로그인(OAuth) 기능 추가·수정 시 기존 패턴 재사용                        |
| `picake-link-app-deep-links`   | web-user 도메인 링크를 iOS/Android 네이티브 앱으로 여는 딥링크 설정 추가·수정                    |
| `picake-legal-terms`           | 통신판매업 신고정보·이용약관·개인정보처리방침 등 법적 고지사항 작성·갱신                         |
| `picake-review-ios-app-store`  | 웹뷰 앱의 iOS 앱스토어 심사 준비 및 반려 대응                                                    |
| `design-taste-frontend`        | (외부 skill) 랜딩·리디자인 등 프론트엔드 디자인 품질 가이드                                      |
| `emil-design-eng`              | (외부 skill) UI 디테일·컴포넌트·애니메이션 설계 원칙                                             |
| `find-skills`                  | (외부 skill) 필요한 agent skill 검색·설치                                                        |

> 카카오 알림톡 템플릿(`picake-notify-kakao-template`)처럼 backend 전용 skill은 [picake-engineering-backend](https://github.com/picake-team/picake-engineering-backend) 레포에, 인프라 모니터링(`picake-infra-monitor`)·종합 데이터 리포트(`picake-data-report`)처럼 클라우드 루틴이 쓰는 운영 skill은 [picake-engineering-automation](https://github.com/picake-team/picake-engineering-automation) 레포의 `.claude/skills`에 있습니다.

## 📄 .claude/settings.json

Claude Code의 저장소 공통 권한 설정입니다. 개인별 설정은 `.claude/settings.local.json`(gitignore 대상)에 둡니다.

## 📄 .mcp.json

Claude Code가 연결하는 MCP(Model Context Protocol) 서버 목록입니다. PostHog, Vercel, Sentry, AWS, Firebase, 카카오, GCP, Solapi, Google Sheets/Docs 등 팀에서 사용하는 외부 서비스에 에이전트가 직접 조회·조작할 수 있도록 연동되어 있습니다.
