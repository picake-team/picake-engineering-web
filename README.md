# Picake Web

Picake(디저트 주문 플랫폼)의 웹 프론트엔드(`web-user`, `web-seller`, `web-admin`)입니다. Yarn Berry + Workspace 기반 모노레포입니다.

## 🧭 레포 구성

Picake 개발 코드는 아래 레포들로 나뉘어 있습니다.

| 레포                                                                                          | 내용                                                  |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **[picake-engineering-web](https://github.com/picake-team/picake-engineering-web)** (현재)    | 웹 프론트엔드 (`web-user`, `web-seller`, `web-admin`) |
| [picake-engineering-backend](https://github.com/picake-team/picake-engineering-backend)       | 백엔드 API 서버 (NestJS, EC2 배포)                    |
| [picake-engineering-app](https://github.com/picake-team/picake-engineering-app)               | Flutter 앱 (`web-user`을 감싸는 WebView 앱, 예정)     |
| [picake-engineering-automation](https://github.com/picake-team/picake-engineering-automation) | Claude 클라우드 루틴·운영 자동화 스킬                 |

## 🚀 시작하기

### 필수 요구사항

- Node.js (v24 이상)
- Yarn (v4.9.4 이상)

### 로컬 개발 환경변수 설정

- web-seller/.env.development 삽입
- web-user/.env.development 삽입

### 백엔드 실행

API 서버는 별도 레포입니다. 이 레포의 **형제 폴더**에 clone해서 실행하세요(web-user e2e 테스트도 이 위치를 기본값으로 씁니다).

```bash
git clone https://github.com/picake-team/picake-engineering-backend.git ../picake-engineering-backend
```

실행 방법과 로컬 데이터베이스 설정은 [backend README](https://github.com/picake-team/picake-engineering-backend#readme)를 참고하세요.

### 로컬 개발 환경 설치 및 실행

```bash
# 프로젝트 클론
git clone <repository-url>
cd picake-engineering-web

# 의존성 설치(자동으로 postinstall 스크립트 실행, 이름 변경시 자동실행 안됨)
# 파일 경로에 한글이 존재하면 오류가 발생할 수 있습니다.
yarn install

# 개발 서버 시작(.env.development 환경변수 필요, backend는 별도 레포)
yarn web-user:dev         # 사용자 웹 개발 서버 (포트: 3001)
yarn web-seller:dev       # 판매자 웹 개발 서버 (포트: 3002)
yarn web-admin:dev        # 관리자 웹 개발 서버 (포트: 3003)

# 빌드 및 배포
yarn web-user:build            # 사용자 웹 빌드
yarn web-seller:build          # 판매자 웹 빌드
yarn web-admin:build           # 관리자 웹 빌드


# 코드 품질 검사
yarn common:lint              # ESLint 검사
yarn common:lint:fix          # ESLint 자동 수정
yarn common:format            # Prettier 포맷팅
yarn common:format:check       # Prettier 포맷팅 검사

# 스토리북 실행
yarn web-user:storybook         # 사용자 스토리북 실행
yarn web-seller:storybook       # 판매자 스토리북 실행
```

## 🚀 배포 방법

### 태그 기반 CI/CD 구성

프로젝트는 GitHub Actions를 통한 태그 기반 자동 배포 시스템을 사용합니다.

#### 태그 형식

각 프로젝트별 태그 형식은 다음과 같습니다:

| 프로젝트     | 태그 형식                                          | 배포 플랫폼 | 예시                         |
| ------------ | -------------------------------------------------- | ----------- | ---------------------------- |
| `web-user`   | `web-user/staging-*` · `web-user/production-*`     | Vercel      | `web-user/production-v1.0.0` |
| `web-seller` | `web-seller/staging-*` · `web-seller/production-*` | Vercel      | `web-seller/staging-v1.0.0`  |
| `web-admin`  | `web-admin/staging-*` · `web-admin/production-*`   | Vercel      | `web-admin/staging-v1.0.0`   |

**태그 구조:** `{프로젝트명}/{환경}-{버전}`

- **프로젝트명**: `web-user`, `web-seller`, `web-admin`
- **환경**: `staging`, `production`
- **버전**: 자유 형식 (예: `v1.0.0`, `v1.0.1`, `2024.01.01`)

#### 배포 프로세스

1. 태그 생성 및 푸시
2. GitHub Actions 워크플로우 자동 실행
3. 프로젝트별 배포 플랫폼(Vercel)으로 자동 배포

backend 배포(`backend/*` 태그, AWS EC2)는 [picake-engineering-backend](https://github.com/picake-team/picake-engineering-backend) 레포에서 합니다.

## 👥 협업 규칙

이 문서는 Picake 프로젝트의 협업 규칙을 정의합니다. 모든 팀원은 이 규칙을 준수해야 합니다.

### 🌿 브랜치 전략

#### 기본 원칙

1. **main 브랜치 보호**
   - `main` 브랜치로 직접 push는 **금지**됩니다.
   - GitHub의 브랜치 보호 규칙이 설정되어 있습니다.
   - `main` 브랜치로의 변경은 반드시 `staging` 브랜치를 거쳐야 합니다.

2. **staging 브랜치**
   - 개발 및 테스트를 위한 통합 브랜치입니다.
   - 모든 기능 개발은 `staging` 브랜치로 병합됩니다.

3. **hotfix 처리**
   - 긴급한 버그 수정이 필요한 경우, `hotfix` 브랜치에서 작업 후 `staging` 브랜치로 **직접 push** 가능합니다.
   - 프로덕션 환경에 즉시 반영이 필요한 경우에만 사용합니다.

4. **일반 기능 개발**
   - 모든 기능 개발은 **기능별 브랜치**를 생성하여 진행합니다.
   - 작업 완료 후 `staging` 브랜치로 **Pull Request(PR)**를 생성합니다.
   - PR 승인 후 병합됩니다.

#### 브랜치 워크플로우

```
main (보호됨)
  ↑
staging (통합 브랜치)
  ↑
feature/xxx (기능 브랜치)
hotfix/xxx (긴급 수정 브랜치)
```

### 📝 브랜치 네이밍 규칙

브랜치 이름은 기능의 목적을 명확히 표현해야 합니다.

#### 브랜치 네이밍 형식

```
{타입}/{기능-설명}
```

#### 브랜치 타입

- `feature/`: 새로운 기능 개발
- `hotfix/`: 긴급 버그 수정
- `fix/`: 일반 버그 수정
- `refactor/`: 코드 리팩토링
- `docs/`: 문서 수정
- `chore/`: 빌드, 설정 등 기타 작업

### 🔄 Pull Request 규칙

#### PR 생성 전 체크리스트

- [ ] 브랜치가 최신 `staging` 브랜치를 기반으로 생성되었는지 확인
- [ ] 코드가 정상적으로 작동하는지 확인
- [ ] `yarn run common:lint` 명령어를 통과했는지 확인
- [ ] `yarn run common:format:check` 명령어를 통과했는지 확인

### 💬 커밋 메시지 규칙

#### 프로젝트 타입

- `[COMMON]` - Common
- `[WEB-SELLER]` - Web Seller
- `[WEB-USER]` - Web User
- `[WEB-ADMIN]` - Web Admin

#### 커밋 타입

- `[TASK]` - 일반 작업
- `[BUG]` - 버그 수정
- `[FEATURE]` - 새로운 기능 추가
- `[CHORE]` - 빌드, 설정 등 기타 작업
- `[DOCS]` - 문서 작성/수정
- `[FIX]` - 버그 수정
- `[REFACTOR]` - 코드 리팩토링
- `[REMOVE]` - 코드 삭제
- `[UI]` - UI 변경
- `[QUESTION]` - 질문/의견

#### 커밋 메시지 예시

```
[COMMON][CHORE]: 의존성 패키지 업데이트
[WEB-SELLER][UI]: 상품 등록 폼 UI 개선
[WEB-USER][FEATURE]: 로그인 페이지 구현
```

## 📚 상세 문서

### 공통 문서

#### 구조 관련

- **[프로젝트 구조 가이드](./docs/common/structure/프로젝트%20구조%20-%20가이드.md)**: 프로젝트 전체 구조 및 디렉토리 설명
- **[Yarn Berry PnP 가이드](<./docs/common/structure/(이전버전)yarnberry%20pnp%20-%20가이드.md>)**: Yarn Berry PnP 설정 및 사용법 (이전 버전)
- **[Yarn Berry node_modules 가이드](<./docs/common/structure/(현재버전)yarnberry%20nodemodules%20-%20가이드.md>)**: Yarn Berry node_modules 설정 및 사용법 (현재 적용)
- **[AI 코딩 에이전트 가이드](./docs/common/structure/AI%20코딩%20에이전트%20-%20가이드.md)**: CLAUDE.md, `.claude/skills`, `.mcp.json` 등 AI 코딩 에이전트 설정

#### 기능 관련

- **[사용자 - 웹뷰 인증 가이드](./docs/common/feature/사용자%20-%20웹뷰%20인증.md)**: Flutter WebView 환경에서의 사용자 인증 시스템 가이드
- **[판매자 인증 가이드](./docs/common/feature/판매자%20인증.md)**: 웹 애플리케이션 환경에서의 판매자 인증 시스템 가이드
- **[스토어 등록(3단계) 가이드](<./docs/common/feature/스토어%20등록(3단계)%20-%20가이드.md>)**: 스토어 등록(3단계) 가이드
- **[채팅 시스템 가이드](./docs/common/feature/채팅%20시스템%20-%20가이드.md)**: Socket.IO 기반 실시간 채팅 시스템 가이드
- **[위치 필터 기능 스펙](./docs/location-filter-spec.md)**: 지역(시/도·시/군/구) 기반 상품/스토어 필터링 스펙

### 프론트엔드 문서

- **[Web User README](./docs/web-user/README.md)**: 사용자 웹 애플리케이션 개요 및 사용법
- **[Web User 기술 스택 가이드](./docs/web-user/기술%20스택%20-%20가이드.md)**: 사용자 웹 애플리케이션 기술 스택
- **[Web User 에러와 로딩 처리 가이드](./docs/web-user/에러와%20로딩%20처리%20-%20가이드.md)**: 에러 처리 및 로딩 상태 관리

- **[Web Seller README](./docs/web-seller/README.md)**: 판매자 웹 애플리케이션 개요 및 사용법
- **[Web Seller 기술 스택 가이드](./docs/web-seller/기술%20스택%20-%20가이드.md)**: 판매자 웹 애플리케이션 기술 스택

- **[Web Admin README](./docs/web-admin/README.md)**: 관리자 웹 애플리케이션 개요 및 사용법
- **[Web Admin 기술 스택 가이드](./docs/web-admin/기술%20스택%20-%20가이드.md)**: 관리자 웹 애플리케이션 기술 스택

### 인프라 문서

#### 배포 플랫폼

- **[Vercel 배포 가이드](./docs/infra/vercel/Vercel%20배포%20-%20가이드.md)**: Vercel 웹 애플리케이션 배포 가이드

### 백엔드·AWS 인프라 문서 (backend 레포)

백엔드 서비스와 AWS EC2 배포 가이드는 [picake-engineering-backend의 docs](https://github.com/picake-team/picake-engineering-backend/tree/main/docs)에서 관리합니다.
