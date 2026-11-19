/**
 * PC(1440) 사장님 화면(기획 I-54): 왼쪽 메뉴, 홈, 주문 목록 | 상세와 처리, 찾기, 엑셀, 주문서 인쇄, 상품 표·판매 스위치,
 * 상품 등록 미리보기, 주문 적기, 캘린더 그날만 영업 바꾸기, 채팅 목록 | 대화, 알림 설정 "이 컴퓨터", PC 가운데 창.
 * 심사용 가게의 상태별 예시 주문을 쓴다. 탭 하나에서 메뉴를 눌러 옮겨 다닌다(helpers.ts openSeller).
 */
import fs from "node:fs";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import {
  api,
  dayButton,
  dayInMonthsFromToday,
  expectNoSideScroll,
  kstKey,
  monthDiff,
  openSeller,
  settledBox,
} from "./helpers";

let context: BrowserContext;
let page: Page;
let storeId = "";

test.beforeAll(async ({ browser }, testInfo) => {
  ({ context, page, storeId } = await openSeller(browser, testInfo));
});

test.afterAll(async () => {
  await context?.close();
});

const menu = () => page.getByRole("navigation", { name: "스토어 메뉴" });
const openMenu = (name: string) =>
  menu()
    .getByRole("link", { name: new RegExp(`^${name}`) })
    .click();
const pageTitle = (name: string) => page.getByRole("heading", { name, exact: true, level: 1 });

test("왼쪽 메뉴와 홈(숫자 칸·주간 보기·처리할 일)", async () => {
  for (const name of ["홈", "주문", "캘린더", "상품", "채팅", "통계", "스토어"]) {
    await expect(menu().getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /^알림/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "설정", exact: true })).toBeVisible();
  // 휴대폰 아래 탭은 PC에 없다
  await expect(page.getByRole("navigation", { name: "아래 탭" })).toHaveCount(0);

  await expect(pageTitle("홈")).toBeVisible();
  await expect(page.getByText("이번 주 매출")).toBeVisible();
  await expect(page.getByText("링크로 온 손님 (30일)")).toBeVisible();
  await expect(page.getByRole("list", { name: "이번 주 픽업" }).getByRole("listitem")).toHaveCount(
    7,
  );
  await expect(page.getByRole("heading", { name: /처리할 일/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /예약 확인/ })).toBeVisible();
  await expectNoSideScroll(page);
});

test("주문: 줄을 누르면 오른쪽에 상세, 상세에서 예약 확인", async () => {
  await openMenu("주문");
  await expect(pageTitle("주문")).toBeVisible();
  await page.locator('section[aria-labelledby="group-confirm"] [role="row"] a').first().click();
  await expect(page).toHaveURL(new RegExp(`/stores/${storeId}/orders/[^/?]+`));
  await expect(page.getByRole("heading", { name: "주문 상세" })).toBeVisible();
  // 목록은 그대로 옆에 남아 있고(두 칸), 상세에는 뒤로가 없다
  await expect(page.getByRole("table", { name: "주문 목록" })).toBeVisible();
  await expect(page.getByRole("button", { name: "뒤로" })).toHaveCount(0);

  await page.getByRole("button", { name: "예약 확인", exact: true }).last().click();
  const dialog = page.getByRole("dialog", { name: "예약을 확인할까요?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "예약 확인" }).click();
  await expect(page.getByText("예약을 확인했어요. 이제 손님 입금을 기다려요")).toBeVisible();
  // 예약 확인 칸이 비어 사라진다
  await expect(page.locator("#group-confirm")).toHaveCount(0);
});

test("주문: 목록 줄에서 바로 예약 확정", async () => {
  await openMenu("주문");
  await expect(page).toHaveURL(new RegExp(`/stores/${storeId}/orders$`));
  const depositRow = page.locator('section[aria-labelledby="group-deposit"] [role="row"]').first();
  await expect(depositRow).toBeVisible();
  await depositRow.getByRole("button", { name: "예약 확정" }).click();
  const dialog = page.getByRole("dialog", { name: "예약을 확정할까요?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "예약 확정" }).click();
  await expect(page.getByText("예약을 확정했어요")).toBeVisible();
  await expect(page.locator("#group-deposit")).toHaveCount(0);
});

test("주문: 찾기 칸에 치면 바로 찾는다", async () => {
  await openMenu("주문");
  const search = page.getByRole("searchbox", { name: "주문 찾기" });
  await search.fill("딸기");
  await expect(page.getByRole("heading", { name: /'딸기' 검색 결과/ })).toBeVisible();
  await expect(page.locator('[role="row"] a').first()).toBeVisible();
  await expect(page).toHaveURL(/q=/);
  await search.fill("");
  await expect(page.getByRole("heading", { name: /검색 결과/ })).toHaveCount(0);
});

test("주문: 엑셀 내려받기(휴대폰 번호 없이)", async () => {
  await openMenu("주문");
  await page.getByRole("button", { name: "엑셀 내려받기" }).click();
  const dialog = page.getByRole("dialog", { name: "엑셀 내려받기" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "최근 3개월" }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    dialog.getByRole("button", { name: "내려받기" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(
    /^주문_.+_\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}\.csv$/,
  );
  const text = fs.readFileSync((await download.path())!, "utf8");
  // 엑셀이 한글을 알아보는 표시(BOM)와 머리줄, 내용 줄
  expect(text.charCodeAt(0)).toBe(0xfeff);
  expect(text).toContain("받은 곳,주문번호,주문받은 날,픽업 날,픽업 시각,상태,상품");
  expect(text.split("\r\n").filter(Boolean).length).toBeGreaterThan(1);
  expect(text).not.toMatch(/01[016789]-?\d{3,4}-?\d{4}/);
  await expect(dialog).toHaveCount(0);
});

test("캘린더: 픽업 있는 날의 주문서 묶음 인쇄(새 탭)", async () => {
  const list = await api<{ data: { pickupDate: string; orderStatus: string }[] }>(
    `/orders?page=1&limit=50&sortBy=LATEST&storeId=${storeId}`,
  );
  const live = list.data.find((o) => !o.orderStatus.startsWith("CANCEL"));
  expect(live).toBeTruthy();
  const date = kstKey(live!.pickupDate);

  // 홈을 거쳐 열어 이번 달 달력부터
  await openMenu("홈");
  await openMenu("캘린더");
  await expect(pageTitle("캘린더")).toBeVisible();
  const diff = monthDiff(kstKey(new Date()), date);
  for (let i = 0; i < Math.abs(diff); i += 1) {
    await page.getByRole("button", { name: diff > 0 ? "다음 달" : "지난달" }).click();
  }
  await dayButton(page.getByRole("grid"), date).click();
  const [sheet] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("link", { name: "이날 주문서 인쇄" }).click(),
  ]);
  await expect(sheet).toHaveURL(new RegExp(`/stores/${storeId}/print/orders\\?date=${date}`));
  await expect(sheet.getByRole("heading", { name: /주문서/ }).first()).toBeVisible();
  await expect(sheet.locator("article").first()).toBeVisible();
  await expect(sheet.getByRole("button", { name: "인쇄하기" })).toBeEnabled();
  // 종이에는 휴대폰 번호 전체가 찍히지 않고, 왼쪽 메뉴도 찍히지 않는다
  await expect(sheet.locator("article").first()).not.toContainText(/010-\d{4}-\d{4}/);
  await sheet.emulateMedia({ media: "print" });
  await expect(sheet.getByRole("navigation", { name: "스토어 메뉴" })).toBeHidden();
  await expect(sheet.getByRole("button", { name: "인쇄하기" })).toBeHidden();
  await sheet.close();
});

test("상품: 표에서 판매 스위치를 바꾸고 되돌리기", async () => {
  await openMenu("상품");
  await expect(pageTitle("상품")).toBeVisible();
  const sw = page.getByRole("switch", { name: / 판매$/ }).first();
  await expect(sw).toHaveAttribute("aria-checked", "true");
  await sw.click();
  await expect(sw).toHaveAttribute("aria-checked", "false");
  await page.getByRole("button", { name: "되돌리기" }).click();
  await expect(sw).toHaveAttribute("aria-checked", "true");
});

test("상품 등록: 오른쪽 손님 화면 미리보기가 입력대로 바뀐다", async () => {
  await openMenu("상품");
  await page.getByRole("button", { name: "상품 등록" }).first().click();
  await expect(page).toHaveURL(new RegExp(`/stores/${storeId}/products/create`));
  const preview = page.getByRole("complementary", { name: "손님 화면 미리보기" });
  await expect(preview).toBeVisible();
  await page.getByPlaceholder("예: 무화과 생크림 케이크").fill("테스트 딸기 케이크");
  await expect(preview).toContainText("테스트 딸기 케이크");
  // 저장 버튼 줄은 왼쪽 메뉴를 피해 본문 안에 있다
  const box = (await page.getByRole("button", { name: "등록하기" }).boundingBox())!;
  expect(box.x).toBeGreaterThan(240);
  await expectNoSideScroll(page);
});

test("주문 적기: 홈 버튼으로 열고 메뉴 옆 본문에 그린다", async () => {
  await openMenu("홈");
  await page.getByRole("button", { name: "주문 적기" }).click();
  await expect(page).toHaveURL(new RegExp(`/stores/${storeId}/manual-orders/new`));
  await expect(page.getByRole("heading", { name: "주문 적기" })).toBeVisible();
  await expect(menu()).toBeVisible();
  const box = (await page.getByRole("button", { name: "등록하기" }).boundingBox())!;
  expect(box.x).toBeGreaterThan(240);
  await expectNoSideScroll(page);
});

test("캘린더: 그날만 휴무로 바꾸고 평소대로 되돌리기", async () => {
  await openMenu("홈");
  await openMenu("캘린더");
  const day = dayInMonthsFromToday(1, 15);
  await page.getByRole("button", { name: "다음 달" }).click();
  await dayButton(page.getByRole("grid"), day).click();
  await page.getByRole("button", { name: "영업 바꾸기" }).click();
  let dialog = page.getByRole("dialog", { name: /영업$/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "휴무" }).click();
  await dialog.getByRole("button", { name: "저장하기" }).click();
  await expect(page.getByText("영업시간을 저장했어요")).toBeVisible();
  await expect(page.getByText("휴무 · 이날만 바꿈")).toBeVisible();
  await expect(dayButton(page.getByRole("grid"), day)).toHaveAccessibleName(/휴무/);

  await page.getByRole("button", { name: "영업 바꾸기" }).click();
  dialog = page.getByRole("dialog", { name: /영업$/ });
  await dialog.getByRole("button", { name: "평소대로" }).click();
  await dialog.getByRole("button", { name: "저장하기" }).click();
  await expect(page.getByText("휴무 · 이날만 바꿈")).toHaveCount(0);
});

test("채팅: 방을 누르면 오른쪽에 대화", async () => {
  await openMenu("채팅");
  await expect(pageTitle("채팅")).toBeVisible();
  await page.getByRole("tab", { name: /전체/ }).click();
  await page.locator('a[href*="/chats/"]').first().click();
  await expect(page).toHaveURL(new RegExp(`/stores/${storeId}/chats/[^/]+$`));
  // 목록은 옆에 남고(두 칸), 대화 칸에 방 제목과 보내기 칸
  await expect(page.locator('a[href*="/chats/"][aria-current="true"]')).toBeVisible();
  await expect(
    page.locator("main h1, header h1").filter({ hasText: /손님/ }).first(),
  ).toBeVisible();
  await expect(page.getByRole("textbox").last()).toBeVisible();
});

test("알림 설정: 설정 → 알림 설정에 PC에만 있는 '이 컴퓨터' 묶음", async () => {
  await page.getByRole("link", { name: "설정", exact: true }).click();
  await page.getByRole("link", { name: /^알림 설정/ }).click();
  await expect(page).toHaveURL(/\/notifications\/settings$/);
  await expect(page.getByRole("heading", { name: "이 컴퓨터" })).toBeVisible();
  await expect(page.getByRole("switch", { name: "주문 알림 소리" })).toBeVisible();
  await expect(page.getByRole("switch", { name: "브라우저 알림" })).toBeVisible();
});

test("아래 창은 PC에서 화면 가운데 창으로 열리고 Esc로 닫힌다", async () => {
  await openMenu("상품");
  await page.getByRole("button", { name: "정렬·거르기" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const box = await settledBox(dialog);
  const vh = page.viewportSize()!.height;
  // 아래에 붙지 않고 가운데(위아래 여백), 폭은 480 이하
  expect(box.y).toBeGreaterThan(16);
  expect(vh - (box.y + box.height)).toBeGreaterThan(16);
  expect(box.width).toBeLessThanOrEqual(480);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("왼쪽 메뉴로 모든 화면이 열리고 가로로 넘치지 않는다", async () => {
  const cases: [string, RegExp][] = [
    ["홈", new RegExp(`/stores/${storeId}$`)],
    ["주문", /\/orders$/],
    ["캘린더", /\/calendar$/],
    ["상품", /\/products$/],
    ["채팅", /\/chats$/],
    ["통계", /\/statistics\/orders$/],
    ["스토어", /\/menu$/],
  ];
  for (const [name, url] of cases) {
    await openMenu(name);
    await expect(page).toHaveURL(url);
    await expect(menu().getByRole("link", { name: new RegExp(`^${name}`) })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expectNoSideScroll(page);
  }
  await page.getByRole("link", { name: "설정", exact: true }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await page.getByRole("link", { name: /^알림/ }).first().click();
  await expect(page).toHaveURL(/\/notifications$/);
  await expectNoSideScroll(page);
});
