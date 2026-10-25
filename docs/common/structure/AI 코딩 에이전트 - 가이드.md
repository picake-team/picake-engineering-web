# AI 코딩 에이전트 - 가이드

이 문서는 Picake 저장소에서 AI 코딩 에이전트(Claude Code 등)가 작업할 때 사용하는 설정을 설명합니다.

## 📄 CLAUDE.md

저장소 루트의 `CLAUDE.md`는 AI 코딩 에이전트가 작업 전 참고하는 가이드 문서입니다. 기존 `AGENTS.md`를 대체합니다.

## 📁 .claude/skills

반복적으로 수행하는 작업을 저장소 전용 규칙으로 정의해 둔 슬래시 커맨드(skill) 모음입니다. 각 skill은 `.claude/skills/<이름>/SKILL.md`에 정의되어 있습니다.

| Skill               | 용도                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------ |
| `commit-convention` | 저장소 커밋 메시지 접두사 규칙(`[프로젝트][타입]: 내용`)에 맞춰 커밋 메시지 작성     |
| `deploy`            | 태그 기반 배포 진행 (web-user/web-seller/web-admin은 Vercel, backend는 backend 레포) |
| `docs-sync`         | 코드 변경 작업을 마칠 때마다 관련 문서(README/docs)를 자동으로 최신화                |
| `docs-refresh`      | 특정 변경과 무관하게 문서 전체를 현재 코드베이스 기준으로 재점검                     |
| `pr-create`         | Pull Request 생성                                                                    |
| `data-report`       | PostHog(행동 데이터)와 관리자 통계(DB 데이터)를 함께 조회해 리포트 제공              |
| `social-login`      | 구글/카카오/애플 등 소셜 로그인(OAuth) 기능 추가·수정 시 기존 패턴 재사용            |
| `app-deep-links`    | web-user 도메인 링크를 iOS/Android 네이티브 앱으로 여는 딥링크 설정 추가·수정        |
| `file-exchange`     | 클립보드 복사/붙여넣기가 어려울 때 파일을 통해 텍스트를 주고받음                     |

> 카카오 알림톡 템플릿(`kakao-template`)처럼 backend 전용 skill은 [picake-engineering-backend](https://github.com/picake-team/picake-engineering-backend) 레포의 `.claude/skills`에 있습니다.

## 📄 .claude/settings.json

Claude Code의 저장소 공통 권한 설정입니다. 개인별 설정은 `.claude/settings.local.json`(gitignore 대상)에 둡니다.

## 📄 .mcp.json

Claude Code가 연결하는 MCP(Model Context Protocol) 서버 목록입니다. PostHog, Vercel, Sentry, AWS, Firebase, 카카오, GCP, Solapi, Google Sheets/Docs 등 팀에서 사용하는 외부 서비스에 에이전트가 직접 조회·조작할 수 있도록 연동되어 있습니다.
