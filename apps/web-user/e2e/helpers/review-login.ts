import { expect, type Page } from "@playwright/test";

/**
 * 테스트 전용 심사용 로그인 코드. 서버 테스트 환경(.env.test — backend 레포 scripts/ci/create-env-test.sh)의
 * CONSUMER_REVIEW_LOGIN_CODE_SHA256이 이 코드의 해시라 테스트에서만 맞는다. 상용·staging 코드는 GitHub 비밀값에만 있다(2026-11-15~)
 */
export const REVIEW_LOGIN_CODE = process.env.E2E_REVIEW_LOGIN_CODE ?? "000000";

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
