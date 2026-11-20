/**
 * 휴대폰(390): PC 작업 뒤에도 휴대폰 화면이 그대로인지(아래 탭, 왼쪽 메뉴 없음, 아래 창은 아래에서) + 휴대폰에 새로 넣은
 * "그날만 영업 바꾸기"(운영자 결정 2026-11-19 "휴대폰에도"). 탭 하나에서 아래 탭·버튼을 눌러 옮겨 다닌다.
 */
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import {
  dayButton,
  dayInMonthsFromToday,
  expectNoSideScroll,
  openSeller,
  settledBox,
} from "./helpers";

let context: BrowserContext;
let page: Page;

test.beforeAll(async ({ browser }, testInfo) => {
  ({ context, page } = await openSeller(browser, testInfo));
});

test.afterAll(async () => {
  await context?.close();
});

const tabs = () => page.getByRole("navigation", { name: "아래 탭" });

/** 안쪽 화면이면 뒤로를 눌러 아래 탭이 있는 화면으로 나온 뒤 그 탭을 누른다 */
async function openTab(name: string) {
  for (let i = 0; i < 3 && !(await tabs().isVisible()); i += 1) {
    await page.getByRole("button", { name: "뒤로" }).click();
    // 화면이 넘어가는 동안 다시 누르지 않게 아래 탭이 나올 때까지 잠깐 기다린다(더 안쪽이면 다음 바퀴에 또 뒤로)
    await tabs()
      .waitFor({ state: "visible", timeout: 2000 })
      .catch(() => {});
  }
  await tabs()
    .getByRole("link", { name: new RegExp(`^${name}`) })
    .click();
}

test("휴대폰 홈은 아래 탭, 왼쪽 메뉴 없음", async () => {
  await expect(tabs()).toBeVisible();
  await expect(page.getByRole("complementary", { name: "메뉴" })).toHaveCount(0);
  await expect(page.getByText("처리할 일")).toBeVisible();
  await expectNoSideScroll(page);
});

test("휴대폰 주문 상세는 한 화면, 안내 창은 아래에서 올라온다", async () => {
  await openTab("주문");
  await page.getByRole("tab", { name: /진행 중/ }).click();
  await page.locator('a[href*="/orders/"]').first().click();
  await expect(page.getByRole("heading", { name: "주문 상세" })).toBeVisible();
  await expect(tabs()).toHaveCount(0);
  await page.getByRole("button", { name: "주문 상태 안내" }).click();
  const dialog = page.getByRole("dialog", { name: "주문 상태 안내" });
  const box = await settledBox(dialog);
  const vh = page.viewportSize()!.height;
  // 아래에 붙은 창
  expect(Math.abs(vh - (box.y + box.height))).toBeLessThan(4);
  await dialog.getByRole("button", { name: "닫기" }).click();
  await expect(dialog).toHaveCount(0);
});

test("휴대폰 캘린더에서도 그날만 영업 바꾸기", async () => {
  await openTab("홈");
  await page.getByRole("link", { name: "캘린더 보기" }).click();
  const day = dayInMonthsFromToday(1, 16);
  await page.getByRole("button", { name: "다음 달" }).click();
  await dayButton(page, day).click();
  await page.getByRole("button", { name: "영업 바꾸기" }).click();
  const dialog = page.getByRole("dialog", { name: /영업$/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "영업", exact: true }).click();
  await expect(dialog.getByRole("button", { name: /^시작 / })).toBeVisible();
  await dialog.getByRole("button", { name: "돌아가기" }).click();
  await expect(dialog).toHaveCount(0);
  await expectNoSideScroll(page);
});

// 스토어 정보 "손님 연락 채널"(운영자 2026-11-20 시안 B): 채널마다 한 줄, 누르면 아래 창에서 적는다.
// 저장은 하지 않는다(심사용 가게 값을 바꾸지 않게) — 빈 전화번호는 화면이 먼저 막는다
test("스토어 정보: 연락 채널 줄을 눌러 적고, 전화번호가 비면 그 줄에 고칠 곳", async () => {
  await openTab("스토어");
  await page.getByRole("link", { name: /스토어 정보/ }).click();
  const section = page.locator("#section-store-contact");
  await expect(section.getByText("Picake 채팅")).toBeVisible();

  const insta = section.getByRole("button", { name: /인스타그램/ });
  await insta.click();
  const instaSheet = page.getByRole("dialog", { name: "인스타그램 ID" });
  await instaSheet.getByRole("textbox").fill("picake_e2e");
  await instaSheet.getByRole("button", { name: "확인" }).click();
  await expect(instaSheet).toHaveCount(0);
  await expect(insta).toContainText("picake_e2e");
  await expect(section.getByRole("switch", { name: "인스타그램 손님에게 보이기" })).toBeEnabled();

  await section.getByRole("button", { name: /전화/ }).click();
  const phoneSheet = page.getByRole("dialog", { name: "전화번호" });
  await phoneSheet.getByRole("textbox").fill("");
  await phoneSheet.getByRole("button", { name: "확인" }).click();
  await expect(section.getByRole("switch", { name: "전화 손님에게 보이기" })).toBeDisabled();
  await page.getByRole("button", { name: "저장하기" }).click();
  await expect(section.getByText("전화번호를 입력해 주세요.")).toBeVisible();
  await expect(page.getByRole("button", { name: "고칠 곳 1개" })).toBeVisible();
  await expectNoSideScroll(page);
});
