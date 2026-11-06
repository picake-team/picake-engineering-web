import { useSyncExternalStore } from "react";
import {
  PHONE_MAX_WIDTH_PX,
  SCREEN_MODE,
  shouldShowMobileScreens,
} from "@/apps/web-seller/common/constants/screen.constant";

const QUERY = `(max-width: ${PHONE_MAX_WIDTH_PX}px)`;

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getIsPhoneWidth() {
  return window.matchMedia(QUERY).matches;
}

/** 휴대폰 폭인지(돌리거나 창 크기를 바꾸면 다시 그린다) */
export function useIsPhoneWidth(): boolean {
  return useSyncExternalStore(subscribe, getIsPhoneWidth, () => false);
}

/** 지금 휴대폰 화면을 그릴지(SCREEN_MODE + 화면 폭) */
export function useShowMobileScreens(): boolean {
  const isPhoneWidth = useIsPhoneWidth();
  return shouldShowMobileScreens(SCREEN_MODE, isPhoneWidth);
}
