/**
 * 태블릿·작은 노트북(기획 I-54). 탭 하나에서 폭만 바꿔 본다(태블릿을 돌리거나 창 크기를 바꾸는 것과 같다).
 * - 1024: 아이콘 메뉴 + 목록 | 상세 두 칸
 * - 834: 아이콘 메뉴 + 한 칸(누르면 상세, 뒤로 = 목록)
 * - 768(PC 화면이 시작하는 폭): 모든 메뉴 화면이 가로로 넘치지 않는다
 */
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { expectNoSideScroll, openSeller } from "./helpers";

let context: BrowserContext;
let page: Page;
let storeId = "";

test.beforeAll(async ({ browser }, testInfo) => {
  ({ context, page, storeId } = await openSeller(browser, testInfo));
});

test.afterAll(async () => {
  await context?.close();
});

const openMenu = (name: string) =>
  page
    .getByRole("navigation", { name: "스토어 메뉴" })
    .getByRole("link", { name: new RegExp(`^${name}`) })
    .click();
const orderTable = () => page.getByRole("table", { name: "주문 목록" });
const detailTitle = () => page.getByRole("heading", { name: "주문 상세" });

/** 주문 메뉴의 "지난 주문" 탭 첫 줄을 연다 — 처리할 것은 PC 테스트가 다 처리해 비어 있을 수 있다 */
async function openFirstOrder() {
  await openMenu("주문");
  await page.getByRole("tab", { name: /지난 주문/ }).click();
  const row = page.locator('[role="row"] a').first();
  await expect(row).toBeVisible();
  await row.click();
}

test("1024: 아이콘 메뉴, 주문은 두 칸", async () => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const aside = page.getByRole("complementary", { name: "메뉴" });
  await expect(aside).toBeVisible();
  expect((await aside.boundingBox())!.width).toBeLessThan(120);
  await expect(page.getByRole("heading", { name: /처리할 일/ })).toBeVisible();
  await expectNoSideScroll(page);

  await openFirstOrder();
  await expect(detailTitle()).toBeVisible();
  await expect(orderTable()).toBeVisible();
  await expect(page.getByRole("button", { name: "뒤로" })).toHaveCount(0);
});

test("834: 한 칸, 누르면 상세 화면, 뒤로 = 목록", async () => {
  await page.setViewportSize({ width: 834, height: 1112 });
  await openFirstOrder();
  await expect(detailTitle()).toBeVisible();
  await expect(orderTable()).toHaveCount(0);
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(orderTable()).toBeVisible();
  await expectNoSideScroll(page);
});

test("돌려도(834 ↔ 1024) 보던 주문이 그대로", async () => {
  await page.setViewportSize({ width: 834, height: 1112 });
  await openFirstOrder();
  await expect(detailTitle()).toBeVisible();
  const url = page.url();
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(orderTable()).toBeVisible();
  await expect(detailTitle()).toBeVisible();
  expect(page.url()).toBe(url);
  await page.setViewportSize({ width: 834, height: 1112 });
  await expect(orderTable()).toHaveCount(0);
  await expect(detailTitle()).toBeVisible();
});

test("834: 채팅도 한 칸", async () => {
  await page.setViewportSize({ width: 834, height: 1112 });
  await openMenu("채팅");
  await page.getByRole("tab", { name: /전체/ }).click();
  await page.locator('a[href*="/chats/"]').first().click();
  await expect(page).toHaveURL(new RegExp(`/stores/${storeId}/chats/[^/]+$`));
  await expect(page.getByRole("button", { name: "뒤로" })).toBeVisible();
  await expectNoSideScroll(page);
});

test("768: 모든 메뉴 화면이 가로로 넘치지 않는다", async () => {
  await page.setViewportSize({ width: 768, height: 1024 });
  for (const name of ["홈", "주문", "캘린더", "상품", "채팅", "통계", "스토어"]) {
    await openMenu(name);
    await page.waitForLoadState("networkidle");
    await expectNoSideScroll(page);
  }
});
