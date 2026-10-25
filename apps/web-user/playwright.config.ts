import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

// backend는 별도 레포(picake-engineering-backend)다. 로컬에서는 이 레포의 형제 폴더를 기본값으로
// 쓰고, 다른 위치에 clone했거나 CI(backend-repo/로 checkout)에서는 BACKEND_DIR로 지정한다.
const backendDir =
  process.env.BACKEND_DIR ?? path.resolve(__dirname, "../../../picake-engineering-backend");

/**
 * 골든패스 E2E(심사용 로그인, 예약 생성)만 다루는 소규모 스위트.
 * backend를 테스트 DB(.env.test)로 마이그레이션·시딩·기동까지 통째로 띄운 뒤,
 * web-user dev 서버를 붙여서 실제 브라우저로 두 서버를 오가며 검증한다.
 *
 * 전제: backend 레포(BACKEND_DIR, 기본값 형제 폴더 ../picake-engineering-backend)에 의존성이
 * 설치돼 있고 apps/backend/.env.test가 가리키는 로컬 Postgres 테스트 DB가 떠 있어야 함
 * (backend의 test:integration/test:e2e와 동일 전제). 같은 테스트 DB를 TRUNCATE하는
 * backend test:integration/test:e2e와 동시에 실행하지 말 것 — 서로 데이터를 지운다.
 */
export default defineConfig({
  testDir: "./e2e",
  // 심사용 로그인 계정·시드 상품 등 테스트 DB 상태를 공유하므로 순차 실행만 허용
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command:
        "yarn workspace @picake/backend db:migrate:test && yarn workspace @picake/backend seed:e2e-fixture && yarn workspace @picake/backend start:test",
      cwd: backendDir,
      url: "http://localhost:3000/v1/consumer/products?sortBy=popular&page=1&limit=1",
      // CI에서는 워크플로우가 이 커맨드를 별도 단계로 먼저 실행해 로그를 남기고 기동까지
      // 끝내둔다(두 webServer를 병렬로 새로 띄우면 한쪽이 죽어도 원인 로그가 거의 안 남는
      // 문제가 있어서 CI 쪽만 분리했다) — 여기서는 이미 떠 있으면 그대로 재사용한다.
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "yarn dev",
      cwd: __dirname,
      url: "http://localhost:3001",
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
