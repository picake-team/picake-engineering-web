import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@playwright/test";
import { TEST_SELLER_REVIEW_CODE } from "./e2e/helpers";

const here = path.dirname(fileURLToPath(import.meta.url));

// backend는 별도 레포(picake-engineering-backend)다. 로컬에서는 형제 폴더를 기본값으로 쓴다(BACKEND_DIR로 바꿀 수 있음).
const backendDir =
  process.env.BACKEND_DIR ?? path.resolve(here, "../../../picake-engineering-backend");

/**
 * 사장님 웹 e2e(기획 I-54 PC 화면 + 휴대폰 화면). 테스트 DB의 심사용 가게(상태별 예시 주문·예시 채팅)로 실제 브라우저에서
 * PC(1440)·태블릿(1024·834·768)·휴대폰(390) 폭을 눌러 본다.
 *
 * 전제: backend 레포 의존성 설치, apps/backend/.env.test가 가리키는 로컬 Postgres 테스트 DB(CORS에 localhost:3002).
 * - 심사용 로그인은 IP당 1시간 5번이라 한 번 돌릴 때 한 번만 부른다(global-setup). 서버를 다시 켜면 한도가 풀린다.
 * - 다른 요청도 같은 경로 1분 100번이라, 테스트는 파일마다 탭 하나에서 메뉴를 눌러 옮겨 다닌다(e2e/helpers.ts openSeller).
 * - 같은 테스트 DB를 비우는 backend test:integration/test:e2e와 동시에 돌리지 말 것.
 */
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3002",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "pc-1440", testMatch: /pc\.spec\.ts/, use: { viewport: { width: 1440, height: 900 } } },
    {
      name: "tablet",
      testMatch: /tablet\.spec\.ts/,
      use: { viewport: { width: 1024, height: 768 }, hasTouch: true },
    },
    {
      name: "phone-390",
      testMatch: /phone\.spec\.ts/,
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: [
    {
      command:
        "yarn workspace @picake/backend db:migrate:test && yarn workspace @picake/backend seed:e2e-fixture && yarn workspace @picake/backend start:test",
      cwd: backendDir,
      env: {
        SELLER_REVIEW_LOGIN_CODE_SHA256: createHash("sha256")
          .update(TEST_SELLER_REVIEW_CODE)
          .digest("hex"),
      },
      url: "http://localhost:3000/v1/consumer/products?sortBy=popular&page=1&limit=1",
      // CI에서는 워크플로가 먼저 띄워 둔다(test-web-e2e.yml). 떠 있으면 그대로 쓴다
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      // --mode e2e: 개인 .env.development(분석·오류 기록 키)를 읽지 않는다. CI(test-web-e2e.yml)도 같은 명령
      command: "npx vite --port 3002 --strictPort --mode e2e",
      cwd: here,
      env: { VITE_PUBLIC_API_DOMAIN: "http://localhost:3000", VITE_PUBLIC_NODE_ENV: "development" },
      url: "http://localhost:3002",
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
