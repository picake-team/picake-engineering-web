import { NODE_ENV } from "@/apps/web-seller/common/constants/environment.constants";

/**
 * 휴대폰 화면(판매자 앱 I-48)을 언제 보여 줄지.
 *
 * - `desktop-only`: 지금 PC 화면만(휴대폰 화면 없음)
 * - `mobile-on-phone`: 폭이 좁으면(휴대폰) 휴대폰 화면이 있는 주소만 휴대폰 화면, 넓으면 지금 PC 화면
 * - `mobile-everywhere`: PC에서도 휴대폰 화면을 가운데에(출시 때, I-48 "정한 것")
 *
 * 지금은 개발·staging에서만 휴대폰 화면을 보인다. production은 출시하거나 "휴대폰 브라우저로 먼저 쓰기"를
 * 정할 때(I-48 "일정") 바꾼다.
 */
export type ScreenMode = "desktop-only" | "mobile-on-phone" | "mobile-everywhere";

/** 이 폭보다 좁으면 휴대폰 화면(PC 화면 AdminLayout도 768에서 접힌다) */
export const PHONE_MAX_WIDTH_PX = 767;

export function screenModeFor(nodeEnv: string | undefined): ScreenMode {
  return nodeEnv === NODE_ENV.PRODUCTION ? "desktop-only" : "mobile-on-phone";
}

export const SCREEN_MODE: ScreenMode = screenModeFor(import.meta.env.VITE_PUBLIC_NODE_ENV);

/** 휴대폰 화면을 그릴지(화면 폭은 PHONE_MAX_WIDTH_PX 이하일 때 isPhoneWidth) */
export function shouldShowMobileScreens(mode: ScreenMode, isPhoneWidth: boolean): boolean {
  if (mode === "mobile-everywhere") return true;
  if (mode === "mobile-on-phone") return isPhoneWidth;
  return false;
}
