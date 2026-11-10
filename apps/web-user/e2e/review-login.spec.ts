import { expect, test } from "@playwright/test";

import { openReviewLoginSheet, reviewLogin } from "./helpers/review-login";

test.describe("심사용 로그인", () => {
  test("올바른 코드를 입력하면 홈으로 이동하고 로그인 상태가 저장된다", async ({ page }) => {
    await reviewLogin(page);

    await expect(page).toHaveURL("/");
    const authState = await page.evaluate(() => localStorage.getItem("picake:auth"));
    expect(authState).not.toBeNull();
    expect(JSON.parse(authState!).state.isAuthenticated).toBe(true);
  });

  test("잘못된 코드를 입력하면 오류가 표시되고 로그인되지 않는다", async ({ page }) => {
    await openReviewLoginSheet(page);

    await page.getByPlaceholder("6자리 코드 입력").fill("000000");
    await page.getByRole("button", { name: "로그인" }).click();

    // 오류 창은 제목 "오류" 대신 안내 글을 제목 자리에 보이고 "확인" 하나를 둔다
    await expect(page.getByRole("button", { name: "확인" })).toBeVisible();
    await expect(page).toHaveURL(/\/mypage\/version$/);
  });
});
