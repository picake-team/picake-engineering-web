import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  expect,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));

export const API = "http://localhost:3000";
export const WEB = "http://localhost:3002";
export const AUTH_DIR = path.join(here, ".auth");
export const AUTH_FILE = path.join(AUTH_DIR, "seller.json");

/** 테스트 DB 전용 사장님 심사용 로그인 코드(상용·staging 코드는 GitHub 비밀값에만 있고 이 값과 다르다) */
export const TEST_SELLER_REVIEW_CODE = "000000";

export function token(): string {
  return fs.readFileSync(path.join(AUTH_DIR, "token.txt"), "utf8").trim();
}

/** 테스트에서 분석·오류 기록 서버로 보내지 않는다(로컬 주소의 모듈 파일은 막지 않음) */
export async function blockAnalytics(context: BrowserContext) {
  await context.route(
    (url) => url.hostname !== "localhost" && /posthog|sentry/i.test(url.hostname),
    (route) => route.abort(),
  );
}

/**
 * 서버 요청 한도(같은 IP·같은 경로 1분 100번) 때문에 테스트마다 앱을 새로 열지 않는다.
 * 파일마다 탭 하나를 열고(beforeAll) 메뉴·버튼을 눌러 옮겨 다닌다(사장님이 실제로 쓰는 모습과 같고, 들어가는 버튼도 같이 확인된다).
 */
export async function openSeller(
  browser: Browser,
  testInfo: TestInfo,
): Promise<{ context: BrowserContext; page: Page; storeId: string }> {
  const { viewport, isMobile, hasTouch } = testInfo.project.use;
  const context = await browser.newContext({
    baseURL: WEB,
    storageState: AUTH_FILE,
    viewport: viewport ?? undefined,
    isMobile,
    hasTouch,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    acceptDownloads: true,
  });
  await blockAnalytics(context);
  const page = await context.newPage();
  await page.goto("/");
  await page.waitForURL(/\/stores\/[^/]+$/);
  const m = page.url().match(/\/stores\/([^/?#]+)/);
  expect(m).not.toBeNull();
  return { context, page, storeId: m![1] };
}

export async function api<T>(p: string): Promise<T> {
  const res = await fetch(`${API}/v1/seller${p}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  expect(res.ok, p).toBeTruthy();
  return (await res.json()).data as T;
}

/** 한국 날짜(YYYY-MM-DD) */
export function kstKey(d: Date | string): string {
  const t = new Date(d).getTime() + 9 * 60 * 60 * 1000;
  return new Date(t).toISOString().slice(0, 10);
}

/** 두 날짜(YYYY-MM-DD) 사이 달 수(뒤가 늦으면 +) */
export function monthDiff(fromKey: string, toKey: string): number {
  const [fy, fm] = fromKey.split("-").map(Number);
  const [ty, tm] = toKey.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

/** 달력의 그날 버튼(이름 "11월 20일(금) 오늘, 픽업 2건", 다른 해면 앞에 "2027년 ") */
export function dayButton(scope: Page | Locator, key: string): Locator {
  const [, m, d] = key.split("-").map(Number);
  return scope.getByRole("button", { name: new RegExp(`(^|\\s)${m}월 ${d}일\\(`) });
}

/** 오늘(한국)에서 n달 뒤 그달 d일(YYYY-MM-DD) */
export function dayInMonthsFromToday(n: number, d: number): string {
  const [y, m] = kstKey(new Date()).split("-").map(Number);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** 창이 올라오는(움직이는) 중에 재지 않도록, 0.1초 간격으로 두 번 같은 자리일 때 위치를 돌려준다 */
export async function settledBox(locator: Locator) {
  let prev = "";
  await expect
    .poll(
      async () => {
        const now = JSON.stringify(await locator.boundingBox());
        const same = now === prev && now !== "null";
        prev = now;
        return same;
      },
      { intervals: [100] },
    )
    .toBe(true);
  return (await locator.boundingBox())!;
}

/** 가로 스크롤이 생기지 않았는지(화면이 폭보다 넓으면 깨진 것) */
export async function expectNoSideScroll(page: Page) {
  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(over, `가로로 ${over}px 넘침: ${page.url()}`).toBeLessThanOrEqual(0);
}
