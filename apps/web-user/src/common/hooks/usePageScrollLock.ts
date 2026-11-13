"use client";

import { useEffect } from "react";
import { SCROLL_CONTAINER_ID } from "@/apps/web-user/common/hooks/useScrollRestoration";

let lockCount = 0;
let saved: { body: string; root: string } | null = null;

function lock() {
  const root = document.getElementById(SCROLL_CONTAINER_ID);
  if (lockCount === 0) {
    saved = { body: document.body.style.overflow, root: root?.style.overflow ?? "" };
    document.body.style.overflow = "hidden";
    if (root) root.style.overflow = "hidden";
  }
  lockCount += 1;
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;
  document.body.style.overflow = saved?.body ?? "";
  const root = document.getElementById(SCROLL_CONTAINER_ID);
  if (root) root.style.overflow = saved?.root ?? "";
  saved = null;
}

/**
 * 창(아래 창·팝업)이 열린 동안 뒤 화면 스크롤을 막는다.
 * 손님 화면은 body가 아니라 `#root-scroll-container`가 스크롤해서, body만 막으면 창을 끌거나 바깥을 밀 때
 * 뒤 화면(상품 상세 등)이 같이 움직였다(2026-11-14, 상품 옵션 선택 창). 스크롤 자리는 그대로 남는다.
 * 창이 겹쳐 열려도 마지막 창이 닫힐 때 한 번만 푼다.
 */
export function usePageScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
