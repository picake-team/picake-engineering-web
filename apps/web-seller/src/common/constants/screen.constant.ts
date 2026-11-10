/**
 * 휴대폰 화면(판매자 앱 I-48)을 언제 보여 줄지.
 *
 * - `desktop-only`: 지금 PC 화면만(휴대폰 화면 없음)
 * - `mobile-on-phone`: 폭이 좁으면(휴대폰) 휴대폰 화면이 있는 주소만 휴대폰 화면, 넓으면 지금 PC 화면
 * - `mobile-everywhere`: PC에서도 휴대폰 화면을 가운데에(출시 때, I-48 "정한 것")
 *
 * 운영자 결정: production도 휴대폰 폭이면 휴대폰 화면을 보인다(휴대폰 브라우저로 먼저 쓰고, 앱 껍데기가
 * production 주소를 바로 쓸 수 있게). PC 폭은 모든 환경에서 지금 PC 화면이다. 출시 때 PC에도 휴대폰 화면을
 * 가운데에 띄울지(`mobile-everywhere`)는 따로 정한다.
 */
export type ScreenMode = "desktop-only" | "mobile-on-phone" | "mobile-everywhere";

/** 이 폭보다 좁으면 휴대폰 화면(PC 화면 AdminLayout도 768에서 접힌다) */
export const PHONE_MAX_WIDTH_PX = 767;

export const SCREEN_MODE: ScreenMode = "mobile-on-phone";

/** 휴대폰 화면을 그릴지(화면 폭은 PHONE_MAX_WIDTH_PX 이하일 때 isPhoneWidth) */
export function shouldShowMobileScreens(mode: ScreenMode, isPhoneWidth: boolean): boolean {
  if (mode === "mobile-everywhere") return true;
  if (mode === "mobile-on-phone") return isPhoneWidth;
  return false;
}
