import { useSyncExternalStore } from "react";
import {
  PHONE_MAX_WIDTH_PX,
  windowClassOf,
  type WindowClass,
} from "@/apps/web-seller/common/constants/screen.constant";

function subscribeQuery(query: string) {
  return (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
}

const PHONE_QUERY = `(max-width: ${PHONE_MAX_WIDTH_PX}px)`;
const subscribePhone = subscribeQuery(PHONE_QUERY);

/** 휴대폰 폭인지(돌리거나 창 크기를 바꾸면 다시 그린다) */
export function useIsPhoneWidth(): boolean {
  return useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}

/** 휴대폰 화면을 그릴지. 휴대폰 폭이면 휴대폰 화면, 넓으면 PC 화면(기획 I-54) */
export function useShowMobileScreens(): boolean {
  return useIsPhoneWidth();
}

const minWidthSubscribers = new Map<number, (onChange: () => void) => () => void>();

/** 폭이 px 이상인지(구간 상수만 넘긴다: TWO_PANE_MIN_WIDTH_PX 등) */
export function useMinWidth(px: number): boolean {
  const query = `(min-width: ${px}px)`;
  let subscribe = minWidthSubscribers.get(px);
  if (!subscribe) {
    subscribe = subscribeQuery(query);
    minWidthSubscribers.set(px, subscribe);
  }
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => true,
  );
}

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

/** 지금 폭 구간(phone · tablet · desktop · wide). 구간이 바뀔 때만 다시 그린다 */
export function useWindowClass(): WindowClass {
  return useSyncExternalStore(
    subscribeResize,
    () => windowClassOf(window.innerWidth),
    () => "desktop",
  );
}
