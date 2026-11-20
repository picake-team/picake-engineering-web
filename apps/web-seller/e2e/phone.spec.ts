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
test("스토어 정보: 연락 채널 줄을 눌러 적고, 전화번호가 비면 그 줄과 창에 고칠 곳", async () => {
  await openTab("스토어");
  await page.getByRole("link", { name: /스토어 정보/ }).click();
  const section = page.locator("#section-store-contact");
  await expect(section.getByText("Picake 채팅")).toBeVisible();

  const insta = section.getByRole("button", { name: /인스타그램/ });
  await insta.click();
  const instaSheet = page.getByRole("dialog", { name: "인스타그램 ID" });
  const instaInput = instaSheet.getByRole("textbox");
  // 창을 열면 바로 칸에 초점
  await expect(instaInput).toBeFocused();
  // 한 글자씩 친다(휴대폰 키보드처럼) — 치는 동안 초점이 칸에서 빠지면 글자가 들어가지 않는다(11-20 창 초점 버그)
  await instaInput.fill("");
  await instaInput.pressSequentially("picake_e2e");
  await expect(instaInput).toHaveValue("picake_e2e");
  await instaSheet.getByRole("button", { name: "확인" }).click();
  await expect(instaSheet).toHaveCount(0);
  await expect(insta).toContainText("picake_e2e");
  // 닫으면 누른 줄로 초점이 돌아간다
  await expect(insta).toBeFocused();
  await expect(section.getByRole("switch", { name: "인스타그램 손님에게 보이기" })).toBeEnabled();

  const phoneRow = section.getByRole("button", { name: /전화/ });
  await phoneRow.click();
  const phoneSheet = page.getByRole("dialog", { name: "전화번호" });
  await phoneSheet.getByRole("textbox").fill("");
  await phoneSheet.getByRole("button", { name: "확인" }).click();
  await expect(section.getByRole("switch", { name: "전화 손님에게 보이기" })).toBeDisabled();
  await page.getByRole("button", { name: "저장하기" }).click();
  await expect(section.getByText("전화번호를 입력해 주세요.")).toBeVisible();
  await expect(page.getByRole("button", { name: "고칠 곳 1개" })).toBeVisible();

  // 고칠 곳이 생긴 뒤 창을 열면 창 안에서도 적는 대로 검사한다
  await phoneRow.click();
  const phoneInput = phoneSheet.getByRole("textbox");
  await expect(phoneSheet.getByText("전화번호를 입력해 주세요.")).toBeVisible();
  await phoneInput.pressSequentially("abcdefgh");
  await expect(phoneSheet.getByText(/숫자·하이픈/)).toBeVisible();
  await phoneInput.fill("");
  await phoneInput.pressSequentially("02-1234-5678");
  await expect(
    phoneSheet.getByText(/전화번호/, { exact: false }).filter({ hasText: "주세요" }),
  ).toHaveCount(0);
  await phoneSheet.getByRole("button", { name: "확인" }).click();
  await expect(phoneRow).toContainText("02-1234-5678");
  await expect(page.getByRole("button", { name: /고칠 곳/ })).toHaveCount(0);
  await expectNoSideScroll(page);
});

// 스토어 만들기 2단계: 등록하기로 고칠 곳이 생긴 뒤 칸 하나를 고쳐도 나머지 고칠 곳은 남는다(11-20 검토 — 전에는 모두 사라짐).
// 사업자 확인은 응답을 흉내 내고(테스트 DB를 바꾸지 않음), 등록은 하지 않는다
test("스토어 만들기: 칸 하나를 고쳐도 다른 고칠 곳은 남는다", async () => {
  await page.route("**/v1/seller/business/validate", (route) =>
    route.fulfill({ json: { success: true, data: { available: true } } }),
  );
  await page.goto("/store/create");
  await page.getByPlaceholder("예: 1234567890 (숫자 10자리)").fill("1234567890");
  await page.getByPlaceholder("예: 홍길동").fill("홍길동");
  await page.getByPlaceholder("예: 20251030 (숫자 8자리)").fill("20251030");
  await page.getByPlaceholder("예: 달콤케이크").fill("달콤케이크");
  await page.getByPlaceholder("예: 제조업").fill("제조업");
  await page.getByPlaceholder("예: 제과점업").fill("제과점업");
  // 칸에 초점이 있으면 키보드가 뜬 것으로 보고 아래 버튼 줄을 숨긴다 — 초점을 뺀다
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.getByRole("button", { name: "다음" }).click();
  await expect(page.locator("#section-store-contact")).toBeVisible();

  await page.getByRole("button", { name: "등록하기" }).click();
  const fix = page.getByRole("button", { name: /^고칠 곳 \d+개$/ });
  await expect(fix).toBeVisible();
  const before = Number((await fix.innerText()).match(/\d+/)![0]);
  await page.getByPlaceholder("예: 달콤케이크").fill("픽케이크 테스트");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await expect(fix).toHaveText(`고칠 곳 ${before - 1}개`);
  await expect(
    page.locator("#section-store-contact").getByText("전화번호를 입력해 주세요."),
  ).toBeVisible();
  await page.unroute("**/v1/seller/business/validate");
});
