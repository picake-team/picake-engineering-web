import { expect, test, type APIRequestContext, type Locator } from "@playwright/test";

import { reviewLogin } from "./helpers/review-login";

const BACKEND_ORIGIN = "http://localhost:3000";
// picake-engineering-backend 레포 apps/backend/src/test/e2e/fixture-seed.script.ts가 만드는 상품명과 동일
const FIXTURE_PRODUCT_NAME = "[E2E] 테스트 케이크";

async function findFixtureProductId(request: APIRequestContext) {
  const res = await request.get(`${BACKEND_ORIGIN}/v1/consumer/products`, {
    params: { sortBy: "popular", page: 1, limit: 20, search: FIXTURE_PRODUCT_NAME },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  const product = body.data.data.find((p: { name: string }) => p.name === FIXTURE_PRODUCT_NAME);
  expect(product, "fixture-seed.script.ts를 먼저 실행해 시드 상품이 있어야 합니다").toBeTruthy();
  return product.id as string;
}

/**
 * 사이즈/맛 Select는 픽업날짜·사이즈를 고르면 다음 단계 Select가 자동으로 열리는
 * UX가 있어(ReservationOptionsView의 openSignal 이펙트) 이미 열려 있을 수도, 아닐 수도 있다.
 * 열려 있지 않을 때만 트리거를 클릭해 두 경우 모두 안전하게 처리한다.
 */
async function selectDropdownOption(sheet: Locator, triggerLabel: string, optionText: string) {
  const option = sheet.getByRole("listitem").filter({ hasText: optionText });
  // 자동으로 열리는 경우 렌더링이 이 시점보다 늦게 반영될 수 있어, 짧게 기다렸다가
  // 그래도 안 열려 있으면 직접 트리거를 클릭한다(이미 열려 있는데 또 클릭하면 토글되어 닫혀버림).
  const alreadyOpen = await option
    .waitFor({ state: "visible", timeout: 1000 })
    .then(() => true)
    .catch(() => false);
  if (!alreadyOpen) {
    await sheet.getByRole("button", { name: triggerLabel }).click();
  }
  await option.click();
}

test("예약(주문) 생성 골든패스", async ({ page, request }) => {
  await reviewLogin(page);

  const productId = await findFixtureProductId(request);
  await page.goto(`/product/${productId}`);

  await page.getByRole("button", { name: "예약하기" }).click();

  // BottomSheet는 열려 있을 때만 마운트되는 단일 인스턴스라, 이 안에서만 찾으면
  // 상품 상세 페이지 하단에 그대로 남아있는 "예약하기" CTA와 헷갈리지 않는다.
  const sheet = page.locator(".animate-slide-up");
  await expect(sheet.getByText("상품 옵션 선택")).toBeVisible();

  // 픽업날짜: 캘린더로 진입해 "내일"을 명시적으로 선택
  // (당일 선택 시 심야 실행이면 남은 시간 슬롯이 없을 수 있음)
  await sheet.getByRole("button", { name: "픽업할 날짜와 시간을 선택해주세요" }).click();
  await expect(sheet.getByText("날짜 선택")).toBeVisible();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await sheet.getByRole("button", { name: String(tomorrow.getDate()), exact: true }).click();
  await sheet
    .getByRole("button", { name: /^(오전|오후) \d{1,2}:\d{2}$/ })
    .first()
    .click();
  await sheet.getByRole("button", { name: "선택완료" }).click();

  // 사이즈/맛 선택 (fixture-seed.script.ts가 심는 옵션과 동일 라벨)
  await selectDropdownOption(sheet, "사이즈 선택", "미니");
  await selectDropdownOption(sheet, "맛 선택", "초콜릿");

  await sheet.getByPlaceholder("가능한 10자 이내로 적어주세요.").fill("생일 축하해");

  await sheet.getByRole("button", { name: "선택완료" }).click();
  await expect(sheet.getByText("주문확인")).toBeVisible();

  // 심사용 계정 프로필의 전화번호(REVIEW_LOGIN_ACCOUNT_PHONE_MARKER)는 실제 휴대폰 형식이
  // 아니라서 prefill 여부와 무관하게 유효한 값으로 덮어써야 한다.
  await sheet.getByPlaceholder("예약자명을 입력해주세요.").fill("테스트예약자");
  await sheet.getByPlaceholder("휴대폰 번호를 입력해주세요.").fill("01099998888");
  // Checkbox의 실제 input은 sr-only(시각적으로 숨김)라 label 텍스트를 클릭해 토글한다
  await sheet.getByText("모두 동의합니다", { exact: true }).click();

  await sheet.getByRole("button", { name: "예약하기" }).click();

  await page.waitForURL(/\/reservation\/complete\?orderId=.+/);
});
