# CLAUDE.md

Picake(디저트 주문 플랫폼)의 **웹 프론트엔드** 레포입니다. Yarn Berry Workspace로 `web-user`(Next.js), `web-seller`, `web-admin`, `web-info`(Next.js, 정보·소개 사이트 `info.picakes.com`)를 관리하고 Vercel에 배포합니다.

## 레포 구성

| 레포                         | 내용                                                                                                                                  | 로컬 위치(권장)                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `picake-engineering-web`     | 웹 프론트엔드 (현재 레포)                                                                                                             | -                                         |
| `picake-engineering-backend` | 백엔드 API 서버 (NestJS, AWS EC2)                                                                                                     | 형제 폴더 `../picake-engineering-backend` |
| `picake-engineering-app`     | 손님·사장님 앱 (웹을 담는 앱 껍데기, 2026-11-13 Flutter → Capacitor로 옮기는 중). 웹–앱 약속 정본은 그 레포 `docs/bridge-contract.md` | 형제 폴더 `../picake-engineering-app`     |
| `picake-hq` (비공개)         | 회사 운영·운영 자동화 (매일 브리핑, 주간 회의, 데이터 리포트·인프라 점검 skill)                                                       | 형제 폴더 `../picake-hq`                  |

- 문서에 나오는 `apps/backend/...` 경로와 `deploy-*-backend-ec2.yml`은 backend 레포의 것입니다.
- 판매자 휴대폰 화면(판매자 앱)을 만들거나 고치면 [`docs/web-seller/판매자 앱 디자인 기준.md`](docs/web-seller/판매자%20앱%20디자인%20기준.md)를 먼저 보고 `apps/web-seller/src/common/ui` 부품만 씁니다(높이 48/40/36, 흰색·회색·주황만, 연한·흐린 주황 금지, 날짜는 앱 창). 화면을 검토·다듬을 때(“사장님 앱 검토해줘”, “더 있을 것 같아”)는 skill `picake-app-review`(두 앱 공용, 전·후 그림으로 골라 받기)를 따릅니다. 손님 화면은 [`docs/web-user/손님 앱 디자인 기준.md`](docs/web-user/손님%20앱%20디자인%20기준.md)를 먼저 봅니다(지금 있는 부품에 맞추고 꾸미지 않기).
- 공통 디자인 값(Picake 색, 움직임 시간·곡선·프리셋, 손님 화면 tailwind preset)은 `packages/design-tokens`(`@picake/design-tokens`)에 있고 web-user·web-info·web-seller가 씁니다. 움직임은 화면마다 `duration-200 ease-out`을 직접 적지 않고 `duration-base ease-enter`·`animate-sheet-in` 같은 이름을 씁니다. 바꾸면 세 앱 화면이 같이 바뀝니다. 두 앱 이상이 같이 쓰는 값만 두고, 판매자 휴대폰 화면 값은 `apps/web-seller/src/common/ui/tokens.ts`에 둡니다.
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
- **공개 레포입니다.** 비밀번호·토큰·키, 개인 휴대폰 번호, 계정 비밀번호를 코드·문서·skill·커밋에 적지 않습니다. 심사 기록처럼 남겨야 할 내용에 이런 값이 들어가면 `{…}`로 가리고 값은 운영자 비밀번호 관리자에 둡니다(2026-11-05 iOS 심사 skill에서 비밀번호가 노출돼 바꾼 일이 있음). 비공개로 남길 기록은 `picake-hq`에 씁니다.
- PR 필수 체크는 `test-web (web-user|web-seller|web-admin|web-info)`입니다. web-info의 `test`는 빌드(`next build`) 검사입니다. `test-web-e2e`는 결과만 보고합니다(필수 아님).

## 운영 skill (picake-hq 레포)

아래 요청은 이 레포에 skill이 없습니다. 형제 폴더 `../picake-hq`(비공개)의 skill 문서를 읽고 그 절차를 따르세요(없으면 `picake-team/picake-hq`를 clone).

| 요청 예                                               | skill 문서                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| "사용자 데이터 보여줘", "전환율 어때", "회원수"       | `../picake-hq/.claude/skills/picake-data-report/SKILL.md`   |
| "인프라 상태 어때", "이번 달 비용", "서버 업그레이드" | `../picake-hq/.claude/skills/picake-infra-monitor/SKILL.md` |
