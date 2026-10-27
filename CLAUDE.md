# CLAUDE.md

Picake(디저트 주문 플랫폼)의 **웹 프론트엔드** 레포입니다. Yarn Berry Workspace로 `web-user`(Next.js), `web-seller`, `web-admin`, `web-info`(Next.js, 정보·소개 사이트 `info.picakes.com`)를 관리하고 Vercel에 배포합니다.

## 레포 구성

| 레포                            | 내용                                                                        | 로컬 위치(권장)                              |
| ------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------- |
| `picake-engineering-web`        | 웹 프론트엔드 (현재 레포)                                                   | -                                            |
| `picake-engineering-backend`    | 백엔드 API 서버 (NestJS, AWS EC2)                                           | 형제 폴더 `../picake-engineering-backend`    |
| `picake-engineering-app`        | Flutter 앱 (`web-user`을 감싸는 WebView 앱)                                 | -                                            |
| `picake-engineering-automation` | Claude 클라우드 루틴·운영 자동화 스킬 (인프라 모니터링, 일일 데이터 리포트) | 형제 폴더 `../picake-engineering-automation` |

- 문서에 나오는 `apps/backend/...` 경로와 `deploy-*-backend-ec2.yml`은 backend 레포의 것입니다.
- 프로젝트 공통 문서는 이 레포 `docs/common`이 정본입니다. 구조는 `docs/common/structure/프로젝트 구조 - 가이드.md`, AI 에이전트 설정은 `docs/common/structure/AI 코딩 에이전트 - 가이드.md`를 참고하세요.

## 자주 쓰는 명령

```bash
yarn web-user:dev | yarn web-seller:dev | yarn web-admin:dev | yarn web-info:dev
yarn web-user:build | yarn web-seller:build | yarn web-admin:build | yarn web-info:build
yarn web-user:test:unit
yarn web-user:test:e2e          # 형제 폴더의 backend 레포가 필요 (BACKEND_DIR로 변경 가능)
yarn common:lint && yarn common:format:check
```

의존성 추가는 `npm`이 아니라 `corepack yarn workspace @picake/<앱> add <pkg>`를 씁니다.

## 작업 규칙

- 커밋 메시지: `picake-git-commit-convention` skill (`[WEB-USER]` / `[WEB-SELLER]` / `[WEB-ADMIN]` / `[WEB-INFO]` / `[COMMON]`)
- PR: `picake-git-pr-create` skill. 작업 브랜치 → `staging` → `main`
- 배포: `<앱>/staging-*`, `<앱>/production-*` 태그 푸시로 Vercel 배포 (`picake-deploy-release` skill, `/push-staging`, `/push-production`)
- PR 필수 체크는 `test-web (web-user|web-seller|web-admin|web-info)`입니다. web-info의 `test`는 빌드(`next build`) 검사입니다. `test-web-e2e`는 결과만 보고합니다(필수 아님).

## 운영 skill (automation 레포)

아래 요청은 이 레포에 skill이 없습니다. 형제 폴더 `../picake-engineering-automation`의 skill 문서를 읽고 그 절차를 따르세요(없으면 `picake-team/picake-engineering-automation`을 clone).

| 요청 예                                               | skill 문서                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| "사용자 데이터 보여줘", "전환율 어때", "회원수"       | `../picake-engineering-automation/.claude/skills/picake-data-report/SKILL.md`   |
| "인프라 상태 어때", "이번 달 비용", "서버 업그레이드" | `../picake-engineering-automation/.claude/skills/picake-infra-monitor/SKILL.md` |
