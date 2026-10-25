import { expect, type Page } from "@playwright/test";

/** picake-engineering-backend 레포 apps/backend/src/modules/auth/constants/auth.constants.ts의 REVIEW_LOGIN_CODE와 동일 */
export const REVIEW_LOGIN_CODE = "482915";

/**
 * 앱스토어 심사 대응 전용 로그인(ReviewLoginBottomSheet)으로 로그인한다.
 * `/mypage/version`에서 "앱 버전" 라벨을 10회 연속 탭하면 진입점이 열린다.
 */
export async function openReviewLoginSheet(page: Page) {
  await page.goto("/mypage/version");
  const versionLabel = page.getByText("앱 버전", { exact: true });
  for (let i = 0; i < 10; i++) {
    await versionLabel.click();
  }
  await expect(page.getByText("심사용 로그인")).toBeVisible();
}

/** 심사용 로그인을 완료하고 홈으로 리다이렉트될 때까지 기다린다. */
export async function reviewLogin(page: Page) {
  await openReviewLoginSheet(page);
  await page.getByPlaceholder("6자리 코드 입력").fill(REVIEW_LOGIN_CODE);
  await page.getByRole("button", { name: "로그인" }).click();
  await page.waitForURL("/");
}
